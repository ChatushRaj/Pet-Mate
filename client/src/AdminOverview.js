import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getPets, getVolunteers, getRescueOrganizations, getPetCenters } from './api';
import './crud.css';

const AdminOverview = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [rescueOrgs, setRescueOrgs] = useState([]);
  const [petCenters, setPetCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [petsData, volunteersData, orgsData, centersData] = await Promise.all([
          getPets(), getVolunteers(), getRescueOrganizations(), getPetCenters(),
        ]);
        setPets(petsData);
        setVolunteers(volunteersData);
        setRescueOrgs(orgsData);
        setPetCenters(centersData);
      } catch (err) {
        setError('Could not load system overview. Please try again.');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="page-loading"><span className="spinner" /> Loading system overview...</div>;
  }

  return (
    <div className="crud-page">
      <div className="crud-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin-dashboard')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1>System Overview</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <h2 className="crud-section-title">All pets ({pets.length})</h2>
      <div className="crud-list">
        {pets.map((pet) => (
          <div key={pet.pet_id} className="card crud-row">
            <div className="crud-row-info">
              <strong>{pet.PetName}</strong>
              <span>{pet.Species} &middot; {pet.Breed} &middot; {pet.Age} yrs</span>
              <span>{pet.rescue_organization || 'No rescue org'} {pet.pet_center ? `→ ${pet.pet_center}` : ''}</span>
            </div>
            <span className={`status ${pet.status}`}>{pet.status}</span>
          </div>
        ))}
        {pets.length === 0 && <div className="empty-state card"><p>No pets in the system yet.</p></div>}
      </div>

      <h2 className="crud-section-title">All volunteers ({volunteers.length})</h2>
      <div className="crud-list">
        {volunteers.map((v) => (
          <div key={v.VolunteerID} className="card crud-row">
            <div className="crud-row-info">
              <strong>{v.VolunteerName}</strong>
              <span>{v.VolunteerEmail} &middot; {v.VolunteerCity}, {v.VolunteerState}</span>
              <span>{v.pet_center_name || 'Unassigned to a center'}</span>
            </div>
            {v.assigned_pet_name && <span className="assigned">Assigned to {v.assigned_pet_name}</span>}
          </div>
        ))}
        {volunteers.length === 0 && <div className="empty-state card"><p>No volunteers in the system yet.</p></div>}
      </div>

      <h2 className="crud-section-title">Rescue organizations ({rescueOrgs.length})</h2>
      <div className="crud-list">
        {rescueOrgs.map((org) => (
          <div key={org.RescueOrgID} className="card crud-row">
            <div className="crud-row-info">
              <strong>{org.OrgName}</strong>
              <span>{org.Email} &middot; {org.Location}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="crud-section-title">Pet centers ({petCenters.length})</h2>
      <div className="crud-list">
        {petCenters.map((center) => (
          <div key={center.PetCenterID} className="card crud-row">
            <div className="crud-row-info">
              <strong>{center.CenterName}</strong>
              <span>{center.City}, {center.State} &middot; Occupancy: {center.CurrentOccupancy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
