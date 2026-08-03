// PetMate Server - Role-Based Authentication and real MySQL-backed CRUD
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 9800;

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set in the environment. Using an insecure default. '
    + 'Set JWT_SECRET in your .env file before deploying this anywhere real.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------
// Database connection pool
// All connection details come from environment variables (see
// .env.example). Never hardcode credentials here.
// ---------------------------------------------------------------------
let pool = null;

const requiredDbEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missingDbEnvVars = requiredDbEnvVars.filter((key) => !process.env[key]);

if (missingDbEnvVars.length > 0) {
  console.warn(`Database environment variables not set (${missingDbEnvVars.join(', ')}). `
    + 'Running in demo mode with mock data. Copy .env.example to .env, run schema.sql against '
    + 'a local MySQL database, and fill in real values to connect for real.');
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Verify the connection actually works at startup; fall back to demo
  // mode rather than crashing if MySQL isn't reachable.
  pool.getConnection()
    .then((conn) => {
      console.log('Connected to MySQL database - PetMate');
      conn.release();
    })
    .catch((err) => {
      console.error('Error connecting to MySQL:', err.message);
      console.log('Running in demo mode with mock data...');
      pool = null;
    });
}

// ---------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// ---------------------------------------------------------------------
// Demo-mode mock data (used only when no database is configured/reachable)
// ---------------------------------------------------------------------
const demo = {
  users: [
    { user_id: 1, username: 'admin', password: 'password123', role: 'admin', organization_id: null, pet_center_id: null },
    { user_id: 2, username: 'rescue1', password: 'password123', role: 'rescue_org', organization_id: 1, pet_center_id: null },
    { user_id: 3, username: 'center1', password: 'password123', role: 'pet_center', organization_id: null, pet_center_id: 1 },
  ],
  pets: [
    { pet_id: 1, PetName: 'Buddy', Age: 3, Breed: 'Golden Retriever', Species: 'Dog', Size: 'Large', PetCondition: 'Healthy', status: 'assigned', rescue_org_id: 1, pet_center_id: 1 },
    { pet_id: 2, PetName: 'Whiskers', Age: 2, Breed: 'Domestic Shorthair', Species: 'Cat', Size: 'Medium', PetCondition: 'Healthy', status: 'available', rescue_org_id: 1, pet_center_id: null },
  ],
  volunteers: [
    { VolunteerID: 1, VolunteerName: 'Sarah Johnson', VolunteerPhoneNumber: '555-0301', VolunteerEmail: 'sarah@email.com', VolunteerCity: 'Austin', VolunteerState: 'TX', pet_center_id: 1, assigned_pet_id: null },
  ],
  adopters: [
    { AdopterID: 1, AdopterName: 'John Smith', AdopterEmail: 'john@email.com', AdopterPhoneNumber: '555-0401', AdopterStreet: '123 Main St', AdopterCity: 'Austin', AdopterState: 'TX' },
  ],
  adoptions: [
    { adoption_id: 1, pet_id: 1, PetName: 'Max', pet_center: 'Austin Pet Haven', VolunteerName: 'Sarah Johnson', AdopterName: 'John Smith', adoption_date: '2024-08-15T10:30:00Z', status: 'completed' },
  ],
  rescueOrgs: [
    { RescueOrgID: 1, OrgName: 'Happy Paws Rescue', Email: 'info@happypaws.org', PhoneNumber: '555-0101', Location: 'Austin, TX' },
    { RescueOrgID: 2, OrgName: 'Second Chance Pets', Email: 'contact@secondchance.org', PhoneNumber: '555-0102', Location: 'Dallas, TX' },
  ],
  petCenters: [
    { PetCenterID: 1, CenterName: 'Austin Pet Haven', City: 'Austin', State: 'TX', Email: 'hello@austinpethaven.org', PhoneNumber: '555-0201', CurrentOccupancy: 25 },
    { PetCenterID: 2, CenterName: 'Dallas Pet Care Center', City: 'Dallas', State: 'TX', Email: 'hello@dallaspetcare.org', PhoneNumber: '555-0202', CurrentOccupancy: 30 },
  ],
};

function isDemoMode() {
  return pool === null;
}

// ---------------------------------------------------------------------
// Auth routes
// ---------------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    let user;

    if (isDemoMode()) {
      const demoUser = demo.users.find((u) => u.username === username);
      if (!demoUser || password !== 'password123') {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      user = demoUser;
    } else {
      const [rows] = await pool.execute('SELECT * FROM Users WHERE username = ?', [username]);
      if (rows.length !== 1) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      const dbUser = rows[0];
      const isValidPassword = await bcrypt.compare(password, dbUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      user = dbUser;
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id,
        pet_center_id: user.pet_center_id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id,
        pet_center_id: user.pet_center_id,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ---------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------
app.get('/api/dashboard-stats', authenticateToken, async (req, res) => {
  const { role, organization_id, pet_center_id } = req.user;

  try {
    if (isDemoMode()) {
      const statsByRole = {
        admin: { totalPets: 25, availablePets: 15, totalAdoptions: 10, totalRescueOrgs: 3, totalPetCenters: 3, totalVolunteers: 12 },
        rescue_org: { totalPets: 8, availablePets: 5, adoptedPets: 3 },
        pet_center: { totalPets: 12, availablePets: 8, totalVolunteers: 6, totalAdoptions: 4 },
      };
      return res.json(statsByRole[role] || {});
    }

    if (role === 'admin') {
      const [[{ totalPets }]] = await pool.query('SELECT COUNT(*) AS totalPets FROM Pets');
      const [[{ availablePets }]] = await pool.query("SELECT COUNT(*) AS availablePets FROM Pets WHERE status = 'available'");
      const [[{ totalAdoptions }]] = await pool.query('SELECT COUNT(*) AS totalAdoptions FROM Adoptions');
      const [[{ totalRescueOrgs }]] = await pool.query('SELECT COUNT(*) AS totalRescueOrgs FROM RescueOrganizations');
      const [[{ totalPetCenters }]] = await pool.query('SELECT COUNT(*) AS totalPetCenters FROM PetCenters');
      const [[{ totalVolunteers }]] = await pool.query('SELECT COUNT(*) AS totalVolunteers FROM Volunteers');
      return res.json({ totalPets, availablePets, totalAdoptions, totalRescueOrgs, totalPetCenters, totalVolunteers });
    }

    if (role === 'rescue_org') {
      const [[{ totalPets }]] = await pool.execute(
        'SELECT COUNT(*) AS totalPets FROM Pets WHERE rescue_org_id = ?', [organization_id]
      );
      const [[{ availablePets }]] = await pool.execute(
        "SELECT COUNT(*) AS availablePets FROM Pets WHERE rescue_org_id = ? AND status = 'available'", [organization_id]
      );
      const [[{ adoptedPets }]] = await pool.execute(
        "SELECT COUNT(*) AS adoptedPets FROM Pets WHERE rescue_org_id = ? AND status = 'adopted'", [organization_id]
      );
      return res.json({ totalPets, availablePets, adoptedPets });
    }

    if (role === 'pet_center') {
      const [[{ totalPets }]] = await pool.execute(
        'SELECT COUNT(*) AS totalPets FROM Pets WHERE pet_center_id = ?', [pet_center_id]
      );
      const [[{ availablePets }]] = await pool.query("SELECT COUNT(*) AS availablePets FROM Pets WHERE status = 'available' AND pet_center_id IS NULL");
      const [[{ totalVolunteers }]] = await pool.execute(
        'SELECT COUNT(*) AS totalVolunteers FROM Volunteers WHERE pet_center_id = ?', [pet_center_id]
      );
      const [[{ totalAdoptions }]] = await pool.execute(
        'SELECT COUNT(*) AS totalAdoptions FROM Adoptions WHERE pet_center_id = ?', [pet_center_id]
      );
      return res.json({ totalPets, availablePets, totalVolunteers, totalAdoptions });
    }

    res.json({});
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Pets
// ---------------------------------------------------------------------
app.get('/api/pets', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.pets);
    }

    const { role, organization_id, pet_center_id } = req.user;
    let sql = `
      SELECT p.*, ro.OrgName AS rescue_organization, pc.CenterName AS pet_center
      FROM Pets p
      LEFT JOIN RescueOrganizations ro ON p.rescue_org_id = ro.RescueOrgID
      LEFT JOIN PetCenters pc ON p.pet_center_id = pc.PetCenterID
    `;
    const params = [];

    if (role === 'rescue_org') {
      sql += ' WHERE p.rescue_org_id = ?';
      params.push(organization_id);
    } else if (role === 'pet_center') {
      sql += ' WHERE p.pet_center_id = ?';
      params.push(pet_center_id);
    }
    sql += ' ORDER BY p.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/available-pets', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.pets.filter((p) => p.status === 'available' && !p.pet_center_id));
    }
    const [rows] = await pool.query(`
      SELECT p.*, ro.OrgName AS rescue_organization
      FROM Pets p
      LEFT JOIN RescueOrganizations ro ON p.rescue_org_id = ro.RescueOrgID
      WHERE p.status = 'available' AND p.pet_center_id IS NULL
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching available pets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pets', authenticateToken, authorizeRole('admin', 'rescue_org'), async (req, res) => {
  const { PetName, Age, Breed, Species, Size, PetCondition } = req.body;

  if (!PetName) {
    return res.status(400).json({ error: 'PetName is required' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true, pet_id: demo.pets.length + 1 });
    }

    const rescueOrgId = req.user.role === 'rescue_org' ? req.user.organization_id : (req.body.rescue_org_id || null);

    const [result] = await pool.execute(
      `INSERT INTO Pets (PetName, Age, Breed, Species, Size, PetCondition, status, rescue_org_id)
       VALUES (?, ?, ?, ?, ?, ?, 'available', ?)`,
      [PetName, Age || null, Breed || null, Species || null, Size || null, PetCondition || null, rescueOrgId]
    );
    res.json({ success: true, pet_id: result.insertId });
  } catch (error) {
    console.error('Error adding pet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/pets/:petId', authenticateToken, async (req, res) => {
  const { petId } = req.params;
  const allowedFields = ['PetName', 'Age', 'Breed', 'Species', 'Size', 'PetCondition', 'status'];
  const updates = Object.keys(req.body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const setClause = updates.map((field) => `${field} = ?`).join(', ');
    const values = updates.map((field) => req.body[field]);
    values.push(petId);

    await pool.execute(`UPDATE Pets SET ${setClause} WHERE pet_id = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/pets/:petId', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    await pool.execute('DELETE FROM Pets WHERE pet_id = ?', [req.params.petId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pets/:petId/assign-to-center', authenticateToken, authorizeRole('admin', 'pet_center'), async (req, res) => {
  const { petId } = req.params;
  const centerId = req.user.role === 'pet_center' ? req.user.pet_center_id : req.body.pet_center_id;

  if (!centerId) {
    return res.status(400).json({ error: 'pet_center_id is required' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true, message: 'Pet assigned to center successfully' });
    }
    await pool.execute(
      "UPDATE Pets SET pet_center_id = ?, status = 'assigned' WHERE pet_id = ?",
      [centerId, petId]
    );
    res.json({ success: true, message: 'Pet assigned to center successfully' });
  } catch (error) {
    console.error('Error assigning pet to center:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Volunteers
// ---------------------------------------------------------------------
app.get('/api/volunteers', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.volunteers);
    }
    const { role, pet_center_id } = req.user;
    let sql = `
      SELECT v.*, p.PetName AS assigned_pet_name, pc.CenterName AS pet_center_name
      FROM Volunteers v
      LEFT JOIN Pets p ON v.assigned_pet_id = p.pet_id
      LEFT JOIN PetCenters pc ON v.pet_center_id = pc.PetCenterID
    `;
    const params = [];
    if (role === 'pet_center') {
      sql += ' WHERE v.pet_center_id = ?';
      params.push(pet_center_id);
    }
    sql += ' ORDER BY v.created_at DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/volunteers', authenticateToken, authorizeRole('admin', 'pet_center'), async (req, res) => {
  const { VolunteerName, VolunteerPhoneNumber, VolunteerEmail, VolunteerCity, VolunteerState } = req.body;

  if (!VolunteerName) {
    return res.status(400).json({ error: 'VolunteerName is required' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true, volunteer_id: demo.volunteers.length + 1 });
    }
    const centerId = req.user.role === 'pet_center' ? req.user.pet_center_id : (req.body.pet_center_id || null);

    const [result] = await pool.execute(
      `INSERT INTO Volunteers (VolunteerName, VolunteerPhoneNumber, VolunteerEmail, VolunteerCity, VolunteerState, pet_center_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [VolunteerName, VolunteerPhoneNumber || null, VolunteerEmail || null, VolunteerCity || null, VolunteerState || null, centerId]
    );
    res.json({ success: true, volunteer_id: result.insertId });
  } catch (error) {
    console.error('Error adding volunteer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/volunteers/:id', authenticateToken, authorizeRole('admin', 'pet_center'), async (req, res) => {
  const allowedFields = ['VolunteerName', 'VolunteerPhoneNumber', 'VolunteerEmail', 'VolunteerCity', 'VolunteerState', 'assigned_pet_id'];
  const updates = Object.keys(req.body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }

    if (req.user.role === 'pet_center') {
      const [volRows] = await pool.execute(
        'SELECT pet_center_id FROM Volunteers WHERE VolunteerID = ?', [req.params.id]
      );
      if (volRows.length === 0) {
        return res.status(404).json({ error: 'Volunteer not found.' });
      }
      if (volRows[0].pet_center_id !== req.user.pet_center_id) {
        return res.status(403).json({ error: 'This volunteer does not belong to your center.' });
      }

      if (req.body.assigned_pet_id) {
        const [petRows] = await pool.execute(
          'SELECT pet_center_id FROM Pets WHERE pet_id = ?', [req.body.assigned_pet_id]
        );
        if (petRows.length === 0 || petRows[0].pet_center_id !== req.user.pet_center_id) {
          return res.status(403).json({ error: 'That pet is not assigned to your center.' });
        }
      }
    }

    const setClause = updates.map((field) => `${field} = ?`).join(', ');
    const values = updates.map((field) => req.body[field]);
    values.push(req.params.id);

    await pool.execute(`UPDATE Volunteers SET ${setClause} WHERE VolunteerID = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating volunteer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/volunteers/:id', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    await pool.execute('DELETE FROM Volunteers WHERE VolunteerID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Adopters
// ---------------------------------------------------------------------
app.get('/api/adopters', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.adopters);
    }
    const [rows] = await pool.query('SELECT * FROM Adopters ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching adopters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/adopters', authenticateToken, authorizeRole('admin', 'pet_center'), async (req, res) => {
  const { AdopterName, AdopterEmail, AdopterPhoneNumber, AdopterStreet, AdopterCity, AdopterState } = req.body;

  if (!AdopterName) {
    return res.status(400).json({ error: 'AdopterName is required' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true, adopter_id: demo.adopters.length + 1 });
    }
    const [result] = await pool.execute(
      `INSERT INTO Adopters (AdopterName, AdopterEmail, AdopterPhoneNumber, AdopterStreet, AdopterCity, AdopterState)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [AdopterName, AdopterEmail || null, AdopterPhoneNumber || null, AdopterStreet || null, AdopterCity || null, AdopterState || null]
    );
    res.json({ success: true, adopter_id: result.insertId });
  } catch (error) {
    console.error('Error adding adopter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/adopters/:id', authenticateToken, async (req, res) => {
  const allowedFields = ['AdopterName', 'AdopterEmail', 'AdopterPhoneNumber', 'AdopterStreet', 'AdopterCity', 'AdopterState'];
  const updates = Object.keys(req.body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const setClause = updates.map((field) => `${field} = ?`).join(', ');
    const values = updates.map((field) => req.body[field]);
    values.push(req.params.id);

    await pool.execute(`UPDATE Adopters SET ${setClause} WHERE AdopterID = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating adopter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/adopters/:id', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    await pool.execute('DELETE FROM Adopters WHERE AdopterID = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting adopter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Adoptions
// ---------------------------------------------------------------------
app.get('/api/adoptions', authenticateToken, async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.adoptions);
    }
    const { role, pet_center_id } = req.user;
    let sql = `
      SELECT a.adoption_id, p.PetName, pc.CenterName AS pet_center, v.VolunteerName,
             ad.AdopterName, a.adoption_date, a.status
      FROM Adoptions a
      JOIN Pets p ON a.pet_id = p.pet_id
      LEFT JOIN PetCenters pc ON a.pet_center_id = pc.PetCenterID
      LEFT JOIN Volunteers v ON a.volunteer_id = v.VolunteerID
      JOIN Adopters ad ON a.adopter_id = ad.AdopterID
    `;
    const params = [];
    if (role === 'pet_center') {
      sql += ' WHERE a.pet_center_id = ?';
      params.push(pet_center_id);
    }
    sql += ' ORDER BY a.adoption_date DESC';

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching adoptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/adoptions', authenticateToken, authorizeRole('admin', 'pet_center'), async (req, res) => {
  const { pet_id, adopter_id, volunteer_id } = req.body;

  if (!pet_id || !adopter_id) {
    return res.status(400).json({ error: 'pet_id and adopter_id are required' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true, message: 'Adoption recorded successfully' });
    }
    const centerId = req.user.role === 'pet_center' ? req.user.pet_center_id : (req.body.pet_center_id || null);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // A pet_center user may only record adoptions for pets actually
      // assigned to their own center (not any pet in the system).
      if (req.user.role === 'pet_center') {
        const [petRows] = await connection.execute(
          'SELECT pet_center_id, status FROM Pets WHERE pet_id = ?', [pet_id]
        );
        if (petRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: 'Pet not found.' });
        }
        if (petRows[0].pet_center_id !== centerId) {
          await connection.rollback();
          connection.release();
          return res.status(403).json({ error: 'This pet is not assigned to your center.' });
        }
        if (petRows[0].status === 'adopted') {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ error: 'This pet has already been adopted.' });
        }

        if (volunteer_id) {
          const [volRows] = await connection.execute(
            'SELECT pet_center_id FROM Volunteers WHERE VolunteerID = ?', [volunteer_id]
          );
          if (volRows.length === 0 || volRows[0].pet_center_id !== centerId) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ error: 'This volunteer does not belong to your center.' });
          }
        }
      }

      await connection.execute(
        `INSERT INTO Adoptions (pet_id, pet_center_id, volunteer_id, adopter_id, status)
         VALUES (?, ?, ?, ?, 'completed')`,
        [pet_id, centerId, volunteer_id || null, adopter_id]
      );

      await connection.execute("UPDATE Pets SET status = 'adopted' WHERE pet_id = ?", [pet_id]);

      await connection.commit();
      res.json({ success: true, message: 'Adoption recorded successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error recording adoption:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Rescue organizations (admin-managed)
// ---------------------------------------------------------------------
app.get('/api/rescue-organizations', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.rescueOrgs);
    }
    const [rows] = await pool.query('SELECT * FROM RescueOrganizations ORDER BY OrgName');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching rescue organizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/rescue-organizations', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { OrgName, Email, PhoneNumber, Location, username, password } = req.body;

  if (!OrgName) {
    return res.status(400).json({ error: 'OrgName is required' });
  }
  if (!username || !password) {
    return res.status(400).json({ error: 'A username and password are required to create this organization\'s login.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    if (isDemoMode()) {
      return res.json({
        RescueOrgID: demo.rescueOrgs.length + 1,
        OrgName, Email, PhoneNumber, Location,
        username,
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute('SELECT user_id FROM Users WHERE username = ?', [username]);
      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const [orgResult] = await connection.execute(
        'INSERT INTO RescueOrganizations (OrgName, Email, PhoneNumber, Location) VALUES (?, ?, ?, ?)',
        [OrgName, Email || null, PhoneNumber || null, Location || null]
      );
      const newOrgId = orgResult.insertId;

      const passwordHash = await bcrypt.hash(password, 10);
      await connection.execute(
        "INSERT INTO Users (username, password, role, organization_id, pet_center_id) VALUES (?, ?, 'rescue_org', ?, NULL)",
        [username, passwordHash, newOrgId]
      );

      await connection.commit();
      res.json({ RescueOrgID: newOrgId, OrgName, Email, PhoneNumber, Location, username });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding rescue organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/rescue-organizations/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const allowedFields = ['OrgName', 'Email', 'PhoneNumber', 'Location'];
  const updates = Object.keys(req.body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const setClause = updates.map((field) => `${field} = ?`).join(', ');
    const values = updates.map((field) => req.body[field]);
    values.push(req.params.id);

    await pool.execute(`UPDATE RescueOrganizations SET ${setClause} WHERE RescueOrgID = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating rescue organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/rescue-organizations/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM Users WHERE organization_id = ? AND role = \'rescue_org\'', [req.params.id]);
      await connection.execute('DELETE FROM RescueOrganizations WHERE RescueOrgID = ?', [req.params.id]);
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting rescue organization:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Pet centers (admin-managed)
// ---------------------------------------------------------------------
app.get('/api/pet-centers', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json(demo.petCenters);
    }
    const [rows] = await pool.query('SELECT * FROM PetCenters ORDER BY CenterName');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pet centers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pet-centers', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const { CenterName, City, State, Email, PhoneNumber, CurrentOccupancy, username, password } = req.body;

  if (!CenterName) {
    return res.status(400).json({ error: 'CenterName is required' });
  }
  if (!username || !password) {
    return res.status(400).json({ error: 'A username and password are required to create this center\'s login.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    if (isDemoMode()) {
      return res.json({
        PetCenterID: demo.petCenters.length + 1,
        CenterName, City, State, Email, PhoneNumber, CurrentOccupancy,
        username,
      });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.execute('SELECT user_id FROM Users WHERE username = ?', [username]);
      if (existing.length > 0) {
        await connection.rollback();
        connection.release();
        return res.status(409).json({ error: 'That username is already taken.' });
      }

      const [centerResult] = await connection.execute(
        'INSERT INTO PetCenters (CenterName, City, State, Email, PhoneNumber, CurrentOccupancy) VALUES (?, ?, ?, ?, ?, ?)',
        [CenterName, City || null, State || null, Email || null, PhoneNumber || null, CurrentOccupancy || 0]
      );
      const newCenterId = centerResult.insertId;

      const passwordHash = await bcrypt.hash(password, 10);
      await connection.execute(
        "INSERT INTO Users (username, password, role, organization_id, pet_center_id) VALUES (?, ?, 'pet_center', NULL, ?)",
        [username, passwordHash, newCenterId]
      );

      await connection.commit();
      res.json({ PetCenterID: newCenterId, CenterName, City, State, Email, PhoneNumber, CurrentOccupancy, username });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding pet center:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/pet-centers/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  const allowedFields = ['CenterName', 'City', 'State', 'Email', 'PhoneNumber', 'CurrentOccupancy'];
  const updates = Object.keys(req.body).filter((key) => allowedFields.includes(key));

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const setClause = updates.map((field) => `${field} = ?`).join(', ');
    const values = updates.map((field) => req.body[field]);
    values.push(req.params.id);

    await pool.execute(`UPDATE PetCenters SET ${setClause} WHERE PetCenterID = ?`, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating pet center:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/pet-centers/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    if (isDemoMode()) {
      return res.json({ success: true });
    }
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('DELETE FROM Users WHERE pet_center_id = ? AND role = \'pet_center\'', [req.params.id]);
      await connection.execute('DELETE FROM PetCenters WHERE PetCenterID = ?', [req.params.id]);
      await connection.commit();
      res.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting pet center:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------
app.listen(port, () => {
  console.log(`PetMate Server is running on port ${port}`);
  console.log(isDemoMode()
    ? 'Features: Role-based authentication, JWT tokens, demo mode (no database connected)'
    : 'Features: Role-based authentication, JWT tokens, MySQL connected');
});
