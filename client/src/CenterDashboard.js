import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faSignOutAlt, faPlus, faHeart, faUsers, faHandshake } from '@fortawesome/free-solid-svg-icons';
import {
  getDashboardStats, getPets, getVolunteers, getAvailablePets, getAdoptions, assignPetToCenter,
  getAdopters, addAdopter, recordAdoption, updateVolunteer,
} from './api';
import Modal from './Modal';
import './dashboard.css';

const emptyAdopterForm = { AdopterName: '', AdopterEmail: '', AdopterPhoneNumber: '' };

const CenterDashboard = () => {
  const [stats, setStats] = useState({});
  const [pets, setPets] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [availablePets, setAvailablePets] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [adopters, setAdopters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Record Adoption modal state
  const [adoptingPet, setAdoptingPet] = useState(null);
  const [adopterMode, setAdopterMode] = useState('existing'); // 'existing' | 'new'
  const [selectedAdopterId, setSelectedAdopterId] = useState('');
  const [newAdopterForm, setNewAdopterForm] = useState(emptyAdopterForm);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [adoptionError, setAdoptionError] = useState('');
  const [savingAdoption, setSavingAdoption] = useState(false);

  // Assign Pet modal state
  const [assigningVolunteer, setAssigningVolunteer] = useState(null);
  const [selectedPetForAssign, setSelectedPetForAssign] = useState('');
  const [assignError, setAssignError] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('petmate_user') || '{}');
    setUser(userData);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, petsData, volunteersData, availableData, adoptionsData, adoptersData] = await Promise.all([
        getDashboardStats(),
        getPets(),
        getVolunteers(),
        getAvailablePets(),
        getAdoptions(),
        getAdopters(),
      ]);
      setStats(statsData);
      setPets(petsData);
      setVolunteers(volunteersData);
      setAvailablePets(availableData);
      setAdoptions(adoptionsData);
      setAdopters(adoptersData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPet = async (petId) => {
    try {
      await assignPetToCenter(petId);
      fetchDashboardData();
    } catch (error) {
      console.error('Error assigning pet:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('petmate_token');
    localStorage.removeItem('petmate_user');
    window.location.href = '/';
  };

  // --- Record Adoption ---
  const openAdoptModal = (pet) => {
    setAdoptingPet(pet);
    setAdopterMode('existing');
    setSelectedAdopterId('');
    setNewAdopterForm(emptyAdopterForm);
    setSelectedVolunteerId('');
    setAdoptionError('');
  };

  const closeAdoptModal = () => {
    setAdoptingPet(null);
    setAdoptionError('');
  };

  const handleRecordAdoption = async (e) => {
    e.preventDefault();
    setAdoptionError('');
    setSavingAdoption(true);
    try {
      let adopterId = selectedAdopterId;

      if (adopterMode === 'new') {
        if (!newAdopterForm.AdopterName) {
          setAdoptionError('Adopter name is required.');
          setSavingAdoption(false);
          return;
        }
        const created = await addAdopter(newAdopterForm);
        adopterId = created.adopter_id;
      }

      if (!adopterId) {
        setAdoptionError('Please select or add an adopter.');
        setSavingAdoption(false);
        return;
      }

      await recordAdoption({
        pet_id: adoptingPet.pet_id,
        adopter_id: adopterId,
        volunteer_id: selectedVolunteerId || null,
      });

      closeAdoptModal();
      fetchDashboardData();
    } catch (err) {
      setAdoptionError(err.response?.data?.error || 'Could not record this adoption. Please try again.');
    }
    setSavingAdoption(false);
  };

  // --- Assign Pet to volunteer ---
  const openAssignModal = (volunteer) => {
    setAssigningVolunteer(volunteer);
    setSelectedPetForAssign('');
    setAssignError('');
  };

  const closeAssignModal = () => {
    setAssigningVolunteer(null);
    setAssignError('');
  };

  const handleAssignToVolunteer = async (e) => {
    e.preventDefault();
    if (!selectedPetForAssign) {
      setAssignError('Please select a pet.');
      return;
    }
    setSavingAssign(true);
    setAssignError('');
    try {
      await updateVolunteer(assigningVolunteer.VolunteerID, { assigned_pet_id: selectedPetForAssign });
      closeAssignModal();
      fetchDashboardData();
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Could not assign this pet. Please try again.');
    }
    setSavingAssign(false);
  };

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading dashboard...</div>;
  }

  const unadoptedPets = pets.filter((p) => p.status !== 'adopted');

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">
          <FontAwesomeIcon icon={faPaw} style={{ color: "#e11d48", fontSize: '26px' }} />
          <span className="pet-adoption">PetMate - Pet Center Dashboard</span>
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
            <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
            <div className="stat-info">
              <h3>{stats.totalVolunteers || 0}</h3>
              <p>Volunteers</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><FontAwesomeIcon icon={faHandshake} /></div>
            <div className="stat-info">
              <h3>{stats.totalAdoptions || 0}</h3>
              <p>Adoptions</p>
            </div>
          </div>
        </div>

        <div className="tab-navigation">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab-btn ${activeTab === 'pets' ? 'active' : ''}`} onClick={() => setActiveTab('pets')}>Our Pets</button>
          <button className={`tab-btn ${activeTab === 'volunteers' ? 'active' : ''}`} onClick={() => setActiveTab('volunteers')}>Volunteers</button>
          <button className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`} onClick={() => setActiveTab('available')}>Available Pets</button>
          <button className={`tab-btn ${activeTab === 'adoptions' ? 'active' : ''}`} onClick={() => setActiveTab('adoptions')}>Adoptions</button>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h2>Center Overview</h2>
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Current Pets</h3>
                  <div className="pet-list">
                    {pets.slice(0, 5).map((pet) => (
                      <div key={pet.pet_id} className="pet-item">
                        <span>{pet.PetName}</span>
                        <span className={`status ${pet.status}`}>{pet.status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overview-card">
                  <h3>Recent Adoptions</h3>
                  <div className="adoption-list">
                    {adoptions.slice(0, 5).map((adoption) => (
                      <div key={adoption.adoption_id} className="adoption-item">
                        <span>{adoption.PetName}</span>
                        <span>{new Date(adoption.adoption_date).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pets' && (
            <div className="pets-section">
              <h2>Our Pets</h2>
              <div className="pets-grid">
                {pets.map((pet) => (
                  <div key={pet.pet_id} className="pet-card">
                    <div className="pet-header">
                      <h3>{pet.PetName}</h3>
                      <span className={`status ${pet.status}`}>{pet.status}</span>
                    </div>
                    <div className="pet-details">
                      <p><strong>Age:</strong> {pet.Age} years</p>
                      <p><strong>Breed:</strong> {pet.Breed}</p>
                      <p><strong>Species:</strong> {pet.Species}</p>
                      <p><strong>Size:</strong> {pet.Size}</p>
                      <p><strong>Condition:</strong> {pet.PetCondition}</p>
                      {pet.rescue_organization && <p><strong>From:</strong> {pet.rescue_organization}</p>}
                    </div>
                    <div className="pet-actions">
                      <button
                        className="action-btn"
                        onClick={() => openAdoptModal(pet)}
                        disabled={pet.status === 'adopted'}
                        title={pet.status === 'adopted' ? 'Already adopted' : ''}
                      >
                        <FontAwesomeIcon icon={faHeart} /> {pet.status === 'adopted' ? 'Adopted' : 'Record Adoption'}
                      </button>
                    </div>
                  </div>
                ))}
                {pets.length === 0 && (
                  <div className="empty-state card">
                    <h3>No pets yet</h3>
                    <p>Assign a pet from the "Available Pets" tab to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'volunteers' && (
            <div className="volunteers-section">
              <h2>Our Volunteers</h2>
              <div className="volunteers-grid">
                {volunteers.map((volunteer) => (
                  <div key={volunteer.VolunteerID} className="volunteer-card">
                    <div className="volunteer-header">
                      <h3>{volunteer.VolunteerName}</h3>
                      {volunteer.assigned_pet_name && (
                        <span className="assigned">Assigned to {volunteer.assigned_pet_name}</span>
                      )}
                    </div>
                    <div className="volunteer-details">
                      <p><strong>Email:</strong> {volunteer.VolunteerEmail}</p>
                      <p><strong>Phone:</strong> {volunteer.VolunteerPhoneNumber}</p>
                      <p><strong>Location:</strong> {volunteer.VolunteerCity}, {volunteer.VolunteerState}</p>
                    </div>
                    <div className="volunteer-actions">
                      <button className="action-btn" onClick={() => openAssignModal(volunteer)}>
                        <FontAwesomeIcon icon={faPaw} /> Assign Pet
                      </button>
                    </div>
                  </div>
                ))}
                {volunteers.length === 0 && (
                  <div className="empty-state card">
                    <h3>No volunteers yet</h3>
                    <p>Add volunteers from the Volunteers management page.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'available' && (
            <div className="available-section">
              <h2>Available Pets for Assignment</h2>
              <div className="available-pets-grid">
                {availablePets.map((pet) => (
                  <div key={pet.pet_id} className="available-pet-card">
                    <div className="pet-header">
                      <h3>{pet.PetName}</h3>
                      <span className="status available">Available</span>
                    </div>
                    <div className="pet-details">
                      <p><strong>Age:</strong> {pet.Age} years</p>
                      <p><strong>Breed:</strong> {pet.Breed}</p>
                      <p><strong>Species:</strong> {pet.Species}</p>
                      <p><strong>Size:</strong> {pet.Size}</p>
                      <p><strong>Condition:</strong> {pet.PetCondition}</p>
                      <p><strong>From:</strong> {pet.rescue_organization}</p>
                    </div>
                    <div className="pet-actions">
                      <button className="action-btn primary" onClick={() => handleAssignPet(pet.pet_id)}>
                        <FontAwesomeIcon icon={faPlus} /> Assign to Center
                      </button>
                    </div>
                  </div>
                ))}
                {availablePets.length === 0 && (
                  <div className="empty-state card">
                    <h3>No pets available right now</h3>
                    <p>Check back once a rescue organization registers a new pet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'adoptions' && (
            <div className="adoptions-section">
              <h2>Adoption Records</h2>
              <div className="adoptions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Pet Name</th>
                      <th>Adopter</th>
                      <th>Volunteer</th>
                      <th>Adoption Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adoptions.map((adoption) => (
                      <tr key={adoption.adoption_id}>
                        <td>{adoption.PetName}</td>
                        <td>{adoption.AdopterName || 'N/A'}</td>
                        <td>{adoption.VolunteerName || 'N/A'}</td>
                        <td>{new Date(adoption.adoption_date).toLocaleDateString()}</td>
                        <td><span className={`status ${adoption.status}`}>{adoption.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => setActiveTab('available')}>
              <FontAwesomeIcon icon={faPlus} />
              Assign New Pet
            </button>
            <button className="action-btn" onClick={() => setActiveTab('volunteers')}>
              <FontAwesomeIcon icon={faUsers} />
              Manage Volunteers
            </button>
            <button
              className="action-btn"
              onClick={() => (unadoptedPets.length > 0 ? openAdoptModal(unadoptedPets[0]) : setActiveTab('pets'))}
            >
              <FontAwesomeIcon icon={faHandshake} />
              Record Adoption
            </button>
          </div>
        </div>
      </div>

      {adoptingPet && (
        <Modal title={`Record Adoption - ${adoptingPet.PetName}`} onClose={closeAdoptModal}>
          <form onSubmit={handleRecordAdoption}>
            {adoptionError && <div className="error-banner" style={{ marginBottom: 'var(--space-3)' }}>{adoptionError}</div>}

            <div className="field">
              <label>Adopter</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                <button type="button" className={adopterMode === 'existing' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} onClick={() => setAdopterMode('existing')}>Existing adopter</button>
                <button type="button" className={adopterMode === 'new' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} onClick={() => setAdopterMode('new')}>New adopter</button>
              </div>
            </div>

            {adopterMode === 'existing' ? (
              <div className="field">
                <label>Select adopter</label>
                <select value={selectedAdopterId} onChange={(e) => setSelectedAdopterId(e.target.value)} required>
                  <option value="">-- Choose an adopter --</option>
                  {adopters.map((a) => (
                    <option key={a.AdopterID} value={a.AdopterID}>{a.AdopterName} ({a.AdopterEmail})</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="field">
                  <label>Adopter name</label>
                  <input type="text" value={newAdopterForm.AdopterName} onChange={(e) => setNewAdopterForm({ ...newAdopterForm, AdopterName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Adopter email</label>
                  <input type="email" value={newAdopterForm.AdopterEmail} onChange={(e) => setNewAdopterForm({ ...newAdopterForm, AdopterEmail: e.target.value })} />
                </div>
                <div className="field">
                  <label>Adopter phone</label>
                  <input type="text" value={newAdopterForm.AdopterPhoneNumber} onChange={(e) => setNewAdopterForm({ ...newAdopterForm, AdopterPhoneNumber: e.target.value })} />
                </div>
              </>
            )}

            <div className="field">
              <label>Volunteer (optional)</label>
              <select value={selectedVolunteerId} onChange={(e) => setSelectedVolunteerId(e.target.value)}>
                <option value="">-- None --</option>
                {volunteers.map((v) => (
                  <option key={v.VolunteerID} value={v.VolunteerID}>{v.VolunteerName}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} disabled={savingAdoption}>
              {savingAdoption ? 'Recording...' : 'Record adoption'}
            </button>
          </form>
        </Modal>
      )}

      {assigningVolunteer && (
        <Modal title={`Assign Pet - ${assigningVolunteer.VolunteerName}`} onClose={closeAssignModal}>
          <form onSubmit={handleAssignToVolunteer}>
            {assignError && <div className="error-banner" style={{ marginBottom: 'var(--space-3)' }}>{assignError}</div>}
            <div className="field">
              <label>Select a pet at this center</label>
              <select value={selectedPetForAssign} onChange={(e) => setSelectedPetForAssign(e.target.value)} required>
                <option value="">-- Choose a pet --</option>
                {pets.map((p) => (
                  <option key={p.pet_id} value={p.pet_id}>{p.PetName} ({p.status})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-2)' }} disabled={savingAssign}>
              {savingAssign ? 'Assigning...' : 'Assign pet'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CenterDashboard;
