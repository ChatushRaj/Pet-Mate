import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faSignOutAlt, faChartBar, faBuilding, faHeart } from '@fortawesome/free-solid-svg-icons';
import { getDashboardStats, addRescueOrganization, addPetCenter, getPets, getAdoptions } from './api';
import Modal from './Modal';
import './dashboard.css';

const emptyOrgForm = { OrgName: '', Email: '', PhoneNumber: '', Location: '', username: '', password: '' };
const emptyCenterForm = { CenterName: '', City: '', State: '', Email: '', PhoneNumber: '', CurrentOccupancy: 0, username: '', password: '' };

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [showAddOrg, setShowAddOrg] = useState(false);
  const [orgForm, setOrgForm] = useState(emptyOrgForm);
  const [orgError, setOrgError] = useState('');
  const [orgSuccess, setOrgSuccess] = useState(null);
  const [savingOrg, setSavingOrg] = useState(false);

  const [showAddCenter, setShowAddCenter] = useState(false);
  const [centerForm, setCenterForm] = useState(emptyCenterForm);
  const [centerError, setCenterError] = useState('');
  const [centerSuccess, setCenterSuccess] = useState(null);
  const [savingCenter, setSavingCenter] = useState(false);

  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('petmate_user') || '{}');
    setUser(userData);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('petmate_token');
    localStorage.removeItem('petmate_user');
    window.location.href = '/';
  };

  const closeOrgModal = () => {
    setShowAddOrg(false);
    setOrgForm(emptyOrgForm);
    setOrgError('');
    setOrgSuccess(null);
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setOrgError('');
    setSavingOrg(true);
    try {
      const result = await addRescueOrganization(orgForm);
      setOrgSuccess(result);
      setOrgForm(emptyOrgForm);
      fetchDashboardStats();
    } catch (err) {
      setOrgError(err.response?.data?.error || 'Could not create this organization. Please try again.');
    }
    setSavingOrg(false);
  };

  const closeCenterModal = () => {
    setShowAddCenter(false);
    setCenterForm(emptyCenterForm);
    setCenterError('');
    setCenterSuccess(null);
  };

  const handleCreateCenter = async (e) => {
    e.preventDefault();
    setCenterError('');
    setSavingCenter(true);
    try {
      const result = await addPetCenter(centerForm);
      setCenterSuccess(result);
      setCenterForm(emptyCenterForm);
      fetchDashboardStats();
    } catch (err) {
      setCenterError(err.response?.data?.error || 'Could not create this pet center. Please try again.');
    }
    setSavingCenter(false);
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const [pets, adoptions] = await Promise.all([getPets(), getAdoptions()]);

      const lines = [];
      lines.push('PetMate System Report');
      lines.push(`Generated,${new Date().toLocaleString()}`);
      lines.push('');
      lines.push('Summary');
      lines.push(`Total Pets,${stats.totalPets ?? ''}`);
      lines.push(`Available Pets,${stats.availablePets ?? ''}`);
      lines.push(`Total Adoptions,${stats.totalAdoptions ?? ''}`);
      lines.push(`Rescue Organizations,${stats.totalRescueOrgs ?? ''}`);
      lines.push(`Pet Centers,${stats.totalPetCenters ?? ''}`);
      lines.push(`Volunteers,${stats.totalVolunteers ?? ''}`);
      lines.push('');
      lines.push('Pets');
      lines.push('Name,Species,Breed,Status,Rescue Organization,Pet Center');
      pets.forEach((p) => {
        lines.push([p.PetName, p.Species, p.Breed, p.status, p.rescue_organization || '', p.pet_center || '']
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      });
      lines.push('');
      lines.push('Adoptions');
      lines.push('Pet,Adopter,Pet Center,Date,Status');
      adoptions.forEach((a) => {
        lines.push([a.PetName, a.AdopterName, a.pet_center || '', new Date(a.adoption_date).toLocaleDateString(), a.status]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      });

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `petmate-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Could not generate the report. Please try again.');
    }
    setGeneratingReport(false);
  };

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">
          <FontAwesomeIcon icon={faPaw} style={{ color: "#e11d48", fontSize: '26px' }} />
          <span className="pet-adoption">PetMate - Admin Dashboard</span>
        </div>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
            <div className="stat-info">
              <h3>{stats.totalPets || 0}</h3>
              <p>Total Pets</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faPaw} /></div>
            <div className="stat-info">
              <h3>{stats.availablePets || 0}</h3>
              <p>Available Pets</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faChartBar} /></div>
            <div className="stat-info">
              <h3>{stats.totalAdoptions || 0}</h3>
              <p>Total Adoptions</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faBuilding} /></div>
            <div className="stat-info">
              <h3>{stats.totalRescueOrgs || 0}</h3>
              <p>Rescue Organizations</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faBuilding} /></div>
            <div className="stat-info">
              <h3>{stats.totalPetCenters || 0}</h3>
              <p>Pet Centers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
            <div className="stat-info">
              <h3>{stats.totalVolunteers || 0}</h3>
              <p>Volunteers</p>
            </div>
          </div>
        </div>

        <div className="admin-sections">
          <h2>System Management</h2>

          <div className="section-grid">
            <div className="section-card">
              <h3>Rescue Organizations</h3>
              <p>Manage rescue organizations in the system</p>
              <NavLink to="/admin/rescue-organizations" className="section-link">
                Manage Organizations
              </NavLink>
            </div>

            <div className="section-card">
              <h3>Pet Centers</h3>
              <p>Manage pet centers and their information</p>
              <NavLink to="/admin/pet-centers" className="section-link">
                Manage Centers
              </NavLink>
            </div>

            <div className="section-card">
              <h3>Adoption Records</h3>
              <p>View all adoption records with filters</p>
              <NavLink to="/admin/adoptions" className="section-link">
                View Adoptions
              </NavLink>
            </div>

            <div className="section-card">
              <h3>System Overview</h3>
              <p>View all pets, volunteers, and system data</p>
              <NavLink to="/admin/overview" className="section-link">
                System Overview
              </NavLink>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => setShowAddOrg(true)}>
              <FontAwesomeIcon icon={faBuilding} />
              Add Rescue Organization
            </button>
            <button className="action-btn" onClick={() => setShowAddCenter(true)}>
              <FontAwesomeIcon icon={faBuilding} />
              Add Pet Center
            </button>
            <button className="action-btn" onClick={handleGenerateReport} disabled={generatingReport}>
              <FontAwesomeIcon icon={faChartBar} />
              {generatingReport ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {showAddOrg && (
        <Modal title="Add Rescue Organization" onClose={closeOrgModal}>
          {orgSuccess ? (
            <>
              <div className="credential-notice">
                <strong>Organization created</strong>
                "{orgSuccess.OrgName}" can now log in with the credentials below. Share these with them - passwords aren't recoverable later.
              </div>
              <div className="detail-row"><span>Username</span><span>{orgSuccess.username}</span></div>
              <div className="detail-row"><span>Role</span><span>Rescue Organization</span></div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary" onClick={closeOrgModal}>Done</button>
                <button className="btn btn-secondary" onClick={() => setOrgSuccess(null)}>Add another</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateOrg}>
              {orgError && <div className="error-banner" style={{ marginBottom: 'var(--space-3)' }}>{orgError}</div>}
              <div className="field">
                <label>Organization name</label>
                <input type="text" value={orgForm.OrgName} onChange={(e) => setOrgForm({ ...orgForm, OrgName: e.target.value })} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={orgForm.Email} onChange={(e) => setOrgForm({ ...orgForm, Email: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input type="text" value={orgForm.PhoneNumber} onChange={(e) => setOrgForm({ ...orgForm, PhoneNumber: e.target.value })} />
              </div>
              <div className="field">
                <label>Location</label>
                <input type="text" value={orgForm.Location} onChange={(e) => setOrgForm({ ...orgForm, Location: e.target.value })} />
              </div>
              <div className="field">
                <label>Login username</label>
                <input type="text" value={orgForm.username} onChange={(e) => setOrgForm({ ...orgForm, username: e.target.value })} required />
              </div>
              <div className="field">
                <label>Login password</label>
                <input type="password" value={orgForm.password} onChange={(e) => setOrgForm({ ...orgForm, password: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} disabled={savingOrg}>
                {savingOrg ? 'Creating...' : 'Create organization + login'}
              </button>
            </form>
          )}
        </Modal>
      )}

      {showAddCenter && (
        <Modal title="Add Pet Center" onClose={closeCenterModal}>
          {centerSuccess ? (
            <>
              <div className="credential-notice">
                <strong>Pet center created</strong>
                "{centerSuccess.CenterName}" can now log in with the credentials below. Share these with them - passwords aren't recoverable later.
              </div>
              <div className="detail-row"><span>Username</span><span>{centerSuccess.username}</span></div>
              <div className="detail-row"><span>Role</span><span>Pet Center</span></div>
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn btn-primary" onClick={closeCenterModal}>Done</button>
                <button className="btn btn-secondary" onClick={() => setCenterSuccess(null)}>Add another</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateCenter}>
              {centerError && <div className="error-banner" style={{ marginBottom: 'var(--space-3)' }}>{centerError}</div>}
              <div className="field">
                <label>Center name</label>
                <input type="text" value={centerForm.CenterName} onChange={(e) => setCenterForm({ ...centerForm, CenterName: e.target.value })} required />
              </div>
              <div className="field">
                <label>City</label>
                <input type="text" value={centerForm.City} onChange={(e) => setCenterForm({ ...centerForm, City: e.target.value })} />
              </div>
              <div className="field">
                <label>State</label>
                <input type="text" value={centerForm.State} onChange={(e) => setCenterForm({ ...centerForm, State: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={centerForm.Email} onChange={(e) => setCenterForm({ ...centerForm, Email: e.target.value })} />
              </div>
              <div className="field">
                <label>Phone number</label>
                <input type="text" value={centerForm.PhoneNumber} onChange={(e) => setCenterForm({ ...centerForm, PhoneNumber: e.target.value })} />
              </div>
              <div className="field">
                <label>Login username</label>
                <input type="text" value={centerForm.username} onChange={(e) => setCenterForm({ ...centerForm, username: e.target.value })} required />
              </div>
              <div className="field">
                <label>Login password</label>
                <input type="password" value={centerForm.password} onChange={(e) => setCenterForm({ ...centerForm, password: e.target.value })} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} disabled={savingCenter}>
                {savingCenter ? 'Creating...' : 'Create pet center + login'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
