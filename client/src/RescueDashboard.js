import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faSignOutAlt, faPlus, faHeart, faEye } from '@fortawesome/free-solid-svg-icons';
import { getDashboardStats, getPets, addPet as addPetRequest, getAdoptions } from './api';
import Modal from './Modal';
import './dashboard.css';

const emptyPetForm = { PetName: '', Age: '', Breed: '', Species: '', Size: '', PetCondition: '' };

const RescueDashboard = () => {
  const [stats, setStats] = useState({});
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showAddPet, setShowAddPet] = useState(false);
  const [newPet, setNewPet] = useState(emptyPetForm);

  const [detailsPet, setDetailsPet] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [adoptions, setAdoptions] = useState([]);
  const [loadingAdoptions, setLoadingAdoptions] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('petmate_user') || '{}');
    setUser(userData);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, petsData] = await Promise.all([getDashboardStats(), getPets()]);
      setStats(statsData);
      setPets(petsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = async () => {
    try {
      await addPetRequest(newPet);
      setNewPet(emptyPetForm);
      setShowAddPet(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('petmate_token');
    localStorage.removeItem('petmate_user');
    window.location.href = '/';
  };

  // Both "View Pet History" and "Adoption Reports" need this org's adoptions,
  // filtered client-side since this org's pets are already known.
  const loadAdoptionsForThisOrg = async () => {
    if (adoptions.length > 0) return adoptions;
    setLoadingAdoptions(true);
    try {
      const allAdoptions = await getAdoptions();
      const ourPetIds = new Set(pets.map((p) => p.pet_id));
      const ours = allAdoptions.filter((a) => ourPetIds.has(a.pet_id));
      setAdoptions(ours);
      setLoadingAdoptions(false);
      return ours;
    } catch (error) {
      console.error('Error fetching adoptions:', error);
      setLoadingAdoptions(false);
      return [];
    }
  };

  const openHistory = async () => {
    setShowHistory(true);
    await loadAdoptionsForThisOrg();
  };

  const openReports = async () => {
    setShowReports(true);
    await loadAdoptionsForThisOrg();
  };

  const speciesBreakdown = pets.reduce((acc, p) => {
    const key = p.Species || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const statusBreakdown = pets.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return <div className="loading"><span className="spinner" /> Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="logo">
          <FontAwesomeIcon icon={faPaw} style={{ color: "#e11d48", fontSize: '26px' }} />
          <span className="pet-adoption">PetMate - Rescue Organization Dashboard</span>
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
            <div className="stat-icon"><FontAwesomeIcon icon={faHeart} /></div>
            <div className="stat-info">
              <h3>{stats.adoptedPets || 0}</h3>
              <p>Adopted Pets</p>
            </div>
          </div>
        </div>

        <div className="pets-section">
          <div className="section-header">
            <h2>Our Pets</h2>
            <button className="add-btn" onClick={() => setShowAddPet(true)}>
              <FontAwesomeIcon icon={faPlus} /> Add New Pet
            </button>
          </div>

          {showAddPet && (
            <div className="add-pet-form">
              <h3>Add New Pet</h3>
              <div className="form-grid">
                <input type="text" placeholder="Pet Name" value={newPet.PetName} onChange={(e) => setNewPet({ ...newPet, PetName: e.target.value })} />
                <input type="number" placeholder="Age" value={newPet.Age} onChange={(e) => setNewPet({ ...newPet, Age: e.target.value })} />
                <input type="text" placeholder="Breed" value={newPet.Breed} onChange={(e) => setNewPet({ ...newPet, Breed: e.target.value })} />
                <input type="text" placeholder="Species" value={newPet.Species} onChange={(e) => setNewPet({ ...newPet, Species: e.target.value })} />
                <input type="text" placeholder="Size" value={newPet.Size} onChange={(e) => setNewPet({ ...newPet, Size: e.target.value })} />
                <input type="text" placeholder="Condition" value={newPet.PetCondition} onChange={(e) => setNewPet({ ...newPet, PetCondition: e.target.value })} />
              </div>
              <div className="form-actions">
                <button onClick={handleAddPet} className="save-btn">Save Pet</button>
                <button onClick={() => setShowAddPet(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          )}

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
                  {pet.pet_center && <p><strong>At:</strong> {pet.pet_center}</p>}
                </div>
                <div className="pet-actions">
                  <button className="action-btn" onClick={() => setDetailsPet(pet)}>
                    <FontAwesomeIcon icon={faEye} /> View Details
                  </button>
                </div>
              </div>
            ))}
            {pets.length === 0 && (
              <div className="empty-state card">
                <h3>No pets yet</h3>
                <p>Add your first pet using the button above.</p>
              </div>
            )}
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => setShowAddPet(true)}>
              <FontAwesomeIcon icon={faPlus} />
              Register New Pet
            </button>
            <button className="action-btn" onClick={openHistory}>
              <FontAwesomeIcon icon={faEye} />
              View Pet History
            </button>
            <button className="action-btn" onClick={openReports}>
              <FontAwesomeIcon icon={faHeart} />
              Adoption Reports
            </button>
          </div>
        </div>
      </div>

      {detailsPet && (
        <Modal title={detailsPet.PetName} onClose={() => setDetailsPet(null)}>
          <div className="detail-row"><span>Status</span><span className={`status ${detailsPet.status}`}>{detailsPet.status}</span></div>
          <div className="detail-row"><span>Species</span><span>{detailsPet.Species}</span></div>
          <div className="detail-row"><span>Breed</span><span>{detailsPet.Breed}</span></div>
          <div className="detail-row"><span>Age</span><span>{detailsPet.Age} years</span></div>
          <div className="detail-row"><span>Size</span><span>{detailsPet.Size}</span></div>
          <div className="detail-row"><span>Condition</span><span>{detailsPet.PetCondition}</span></div>
          <div className="detail-row"><span>Pet center</span><span>{detailsPet.pet_center || 'Not yet assigned'}</span></div>
        </Modal>
      )}

      {showHistory && (
        <Modal title="Pet Adoption History" onClose={() => setShowHistory(false)}>
          {loadingAdoptions ? (
            <div className="page-loading"><span className="spinner" /> Loading history...</div>
          ) : adoptions.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>None of your pets have been adopted yet.</p>
          ) : (
            <div className="report-list">
              {adoptions.map((a) => (
                <div key={a.adoption_id} className="report-row">
                  <span>{a.PetName} → {a.AdopterName}</span>
                  <span>{new Date(a.adoption_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showReports && (
        <Modal title="Adoption Reports" onClose={() => setShowReports(false)}>
          {loadingAdoptions ? (
            <div className="page-loading"><span className="spinner" /> Loading report...</div>
          ) : (
            <>
              <div className="detail-row"><span>Total pets registered</span><span>{pets.length}</span></div>
              <div className="detail-row"><span>Total adopted</span><span>{adoptions.length}</span></div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>By status</strong>
                <div className="report-list" style={{ marginTop: 'var(--space-2)' }}>
                  {Object.entries(statusBreakdown).map(([status, count]) => (
                    <div key={status} className="report-row">
                      <span className={`status ${status}`}>{status}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>By species</strong>
                <div className="report-list" style={{ marginTop: 'var(--space-2)' }}>
                  {Object.entries(speciesBreakdown).map(([species, count]) => (
                    <div key={species} className="report-row">
                      <span>{species}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default RescueDashboard;
