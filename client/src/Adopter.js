import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { getAdopters, addAdopter, updateAdopter, deleteAdopter } from './api';
import './crud.css';

const emptyAdopter = {
  AdopterName: '',
  AdopterEmail: '',
  AdopterPhoneNumber: '',
  AdopterStreet: '',
  AdopterCity: '',
  AdopterState: '',
};

const AdopterDashboard = () => {
  const [adopters, setAdopters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newAdopter, setNewAdopter] = useState(emptyAdopter);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(emptyAdopter);

  useEffect(() => {
    fetchAdopters();
  }, []);

  const fetchAdopters = async () => {
    setLoading(true);
    try {
      const data = await getAdopters();
      setAdopters(data);
      setError('');
    } catch (err) {
      setError('Could not load adopters. Please try again.');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setNewAdopter({ ...newAdopter, [e.target.name]: e.target.value });
  };

  const handleAddAdopter = async (e) => {
    e.preventDefault();
    try {
      await addAdopter(newAdopter);
      setNewAdopter(emptyAdopter);
      fetchAdopters();
    } catch (err) {
      setError('Could not add this adopter. Please try again.');
    }
  };

  const handleDeleteAdopter = async (id) => {
    try {
      await deleteAdopter(id);
      fetchAdopters();
    } catch (err) {
      setError('Could not remove this adopter. Please try again.');
    }
  };

  const startEditing = (id, data) => {
    setEditingId(id);
    setEditingData(data);
  };

  const handleUpdateAdopter = async () => {
    try {
      await updateAdopter(editingId, editingData);
      setEditingId(null);
      fetchAdopters();
    } catch (err) {
      setError('Could not update this adopter. Please try again.');
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Adopter Directory</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card crud-form-card">
        <h2>Add a new adopter</h2>
        <form className="crud-form-grid" onSubmit={handleAddAdopter}>
          <div className="field">
            <label>Name</label>
            <input type="text" name="AdopterName" value={newAdopter.AdopterName} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" name="AdopterEmail" value={newAdopter.AdopterEmail} onChange={handleInputChange} />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="text" name="AdopterPhoneNumber" value={newAdopter.AdopterPhoneNumber} onChange={handleInputChange} />
          </div>
          <div className="field">
            <label>Street</label>
            <input type="text" name="AdopterStreet" value={newAdopter.AdopterStreet} onChange={handleInputChange} />
          </div>
          <div className="field">
            <label>City</label>
            <input type="text" name="AdopterCity" value={newAdopter.AdopterCity} onChange={handleInputChange} />
          </div>
          <div className="field">
            <label>State</label>
            <input type="text" name="AdopterState" value={newAdopter.AdopterState} onChange={handleInputChange} />
          </div>
          <button type="submit" className="btn btn-primary crud-form-submit">Add adopter</button>
        </form>
      </div>

      <h2 className="crud-section-title">Registered adopters</h2>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading adopters...</div>
      ) : adopters.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon"><FontAwesomeIcon icon={faUser} /></span>
          <h3>No adopters yet</h3>
          <p>Add your first adopter using the form above.</p>
        </div>
      ) : (
        <div className="crud-list">
          {adopters.map((adopter) => (
            <div key={adopter.AdopterID} className="card crud-row">
              {editingId === adopter.AdopterID ? (
                <>
                  <div className="crud-row-fields">
                    <input type="text" value={editingData.AdopterName} onChange={(e) => setEditingData({ ...editingData, AdopterName: e.target.value })} />
                    <input type="text" value={editingData.AdopterEmail} onChange={(e) => setEditingData({ ...editingData, AdopterEmail: e.target.value })} />
                    <input type="text" value={editingData.AdopterPhoneNumber} onChange={(e) => setEditingData({ ...editingData, AdopterPhoneNumber: e.target.value })} />
                    <input type="text" value={editingData.AdopterStreet} onChange={(e) => setEditingData({ ...editingData, AdopterStreet: e.target.value })} />
                    <input type="text" value={editingData.AdopterCity} onChange={(e) => setEditingData({ ...editingData, AdopterCity: e.target.value })} />
                    <input type="text" value={editingData.AdopterState} onChange={(e) => setEditingData({ ...editingData, AdopterState: e.target.value })} />
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleUpdateAdopter}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="crud-row-info">
                    <strong>{adopter.AdopterName}</strong>
                    <span>{adopter.AdopterEmail} &middot; {adopter.AdopterPhoneNumber}</span>
                    <span>{adopter.AdopterStreet}, {adopter.AdopterCity}, {adopter.AdopterState}</span>
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEditing(adopter.AdopterID, adopter)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAdopter(adopter.AdopterID)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdopterDashboard;
