import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { getVolunteers, addVolunteer, updateVolunteer, deleteVolunteer } from './api';
import './crud.css';

const emptyVolunteer = {
  VolunteerName: '',
  VolunteerPhoneNumber: '',
  VolunteerEmail: '',
  VolunteerCity: '',
  VolunteerState: '',
};

function VolunteerList() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newVolunteer, setNewVolunteer] = useState(emptyVolunteer);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(emptyVolunteer);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const data = await getVolunteers();
      setVolunteers(data);
      setError('');
    } catch (err) {
      setError('Could not load volunteers. Please try again.');
    }
    setLoading(false);
  };

  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    try {
      await addVolunteer(newVolunteer);
      setNewVolunteer(emptyVolunteer);
      fetchVolunteers();
    } catch (err) {
      setError('Could not add this volunteer. Please try again.');
    }
  };

  const startEditing = (volunteer) => {
    setEditingId(volunteer.VolunteerID);
    setEditingData(volunteer);
  };

  const handleSave = async () => {
    try {
      await updateVolunteer(editingId, editingData);
      setEditingId(null);
      fetchVolunteers();
    } catch (err) {
      setError('Could not update this volunteer. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteVolunteer(id);
      fetchVolunteers();
    } catch (err) {
      setError('Could not remove this volunteer. Please try again.');
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Volunteers</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card crud-form-card">
        <h2>Add a new volunteer</h2>
        <form className="crud-form-grid" onSubmit={handleAddVolunteer}>
          <div className="field">
            <label>Name</label>
            <input type="text" value={newVolunteer.VolunteerName} onChange={(e) => setNewVolunteer({ ...newVolunteer, VolunteerName: e.target.value })} required />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="text" value={newVolunteer.VolunteerPhoneNumber} onChange={(e) => setNewVolunteer({ ...newVolunteer, VolunteerPhoneNumber: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={newVolunteer.VolunteerEmail} onChange={(e) => setNewVolunteer({ ...newVolunteer, VolunteerEmail: e.target.value })} />
          </div>
          <div className="field">
            <label>City</label>
            <input type="text" value={newVolunteer.VolunteerCity} onChange={(e) => setNewVolunteer({ ...newVolunteer, VolunteerCity: e.target.value })} />
          </div>
          <div className="field">
            <label>State</label>
            <input type="text" value={newVolunteer.VolunteerState} onChange={(e) => setNewVolunteer({ ...newVolunteer, VolunteerState: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary crud-form-submit">Add volunteer</button>
        </form>
      </div>

      <h2 className="crud-section-title">All volunteers</h2>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading volunteers...</div>
      ) : volunteers.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon"><FontAwesomeIcon icon={faUserGroup} /></span>
          <h3>No volunteers yet</h3>
          <p>Add your first volunteer using the form above.</p>
        </div>
      ) : (
        <div className="crud-list">
          {volunteers.map((volunteer) => (
            <div key={volunteer.VolunteerID} className="card crud-row">
              {editingId === volunteer.VolunteerID ? (
                <>
                  <div className="crud-row-fields">
                    <input type="text" value={editingData.VolunteerName} onChange={(e) => setEditingData({ ...editingData, VolunteerName: e.target.value })} />
                    <input type="text" value={editingData.VolunteerPhoneNumber} onChange={(e) => setEditingData({ ...editingData, VolunteerPhoneNumber: e.target.value })} />
                    <input type="text" value={editingData.VolunteerEmail} onChange={(e) => setEditingData({ ...editingData, VolunteerEmail: e.target.value })} />
                    <input type="text" value={editingData.VolunteerCity} onChange={(e) => setEditingData({ ...editingData, VolunteerCity: e.target.value })} />
                    <input type="text" value={editingData.VolunteerState} onChange={(e) => setEditingData({ ...editingData, VolunteerState: e.target.value })} />
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="crud-row-info">
                    <strong>{volunteer.VolunteerName}</strong>
                    <span>{volunteer.VolunteerEmail} &middot; {volunteer.VolunteerPhoneNumber}</span>
                    <span>{volunteer.VolunteerCity}, {volunteer.VolunteerState}</span>
                    {volunteer.assigned_pet_name && (
                      <span className="assigned">Assigned to {volunteer.assigned_pet_name}</span>
                    )}
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEditing(volunteer)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(volunteer.VolunteerID)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VolunteerList;
