import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { getPetCenters, addPetCenter, updatePetCenter, deletePetCenter } from './api';
import './crud.css';

const emptyCenter = {
  CenterName: '',
  City: '',
  State: '',
  Email: '',
  PhoneNumber: '',
  CurrentOccupancy: 0,
  username: '',
  password: '',
};

function PetCenters() {
  const [petCenters, setPetCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCenter, setNewCenter] = useState(emptyCenter);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(emptyCenter);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    fetchPetCenters();
  }, []);

  const fetchPetCenters = async () => {
    setLoading(true);
    try {
      const data = await getPetCenters();
      setPetCenters(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load pet centers.');
    }
    setLoading(false);
  };

  const handleAddPetCenter = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await addPetCenter(newCenter);
      setCreatedCredentials({ name: created.CenterName, username: created.username });
      setNewCenter(emptyCenter);
      fetchPetCenters();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this pet center.');
    }
  };

  const handleDeletePetCenter = async (id) => {
    try {
      await deletePetCenter(id);
      fetchPetCenters();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete this pet center.');
    }
  };

  const startEditing = (center) => {
    setEditingId(center.PetCenterID);
    setCreatedCredentials(null);
    setEditingData(center);
  };

  const handleUpdatePetCenter = async () => {
    try {
      const { CenterName, City, State, Email, PhoneNumber, CurrentOccupancy } = editingData;
      await updatePetCenter(editingId, { CenterName, City, State, Email, PhoneNumber, CurrentOccupancy });
      setEditingId(null);
      fetchPetCenters();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update this pet center.');
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Pet Centers</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {createdCredentials && (
        <div className="credential-notice">
          <strong>"{createdCredentials.name}" was created</strong>
          Login username: <strong>{createdCredentials.username}</strong> - share this and the password you set with them. Passwords aren't recoverable later.
          <div style={{ marginTop: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setCreatedCredentials(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="card crud-form-card">
        <h2>Add a new pet center</h2>
        <form className="crud-form-grid" onSubmit={handleAddPetCenter}>
          <div className="field">
            <label>Center name</label>
            <input type="text" value={newCenter.CenterName} onChange={(e) => setNewCenter({ ...newCenter, CenterName: e.target.value })} required />
          </div>
          <div className="field">
            <label>City</label>
            <input type="text" value={newCenter.City} onChange={(e) => setNewCenter({ ...newCenter, City: e.target.value })} required />
          </div>
          <div className="field">
            <label>State</label>
            <input type="text" value={newCenter.State} onChange={(e) => setNewCenter({ ...newCenter, State: e.target.value })} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={newCenter.Email} onChange={(e) => setNewCenter({ ...newCenter, Email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={newCenter.PhoneNumber} onChange={(e) => setNewCenter({ ...newCenter, PhoneNumber: e.target.value })} required />
          </div>
          <div className="field">
            <label>Current occupancy</label>
            <input type="number" value={newCenter.CurrentOccupancy} onChange={(e) => setNewCenter({ ...newCenter, CurrentOccupancy: e.target.value })} required />
          </div>
          <div className="field">
            <label>Login username</label>
            <input type="text" value={newCenter.username} onChange={(e) => setNewCenter({ ...newCenter, username: e.target.value })} required />
          </div>
          <div className="field">
            <label>Login password</label>
            <input type="password" value={newCenter.password} onChange={(e) => setNewCenter({ ...newCenter, password: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" className="btn btn-primary crud-form-submit">Add pet center + login</button>
        </form>
      </div>

      <h2 className="crud-section-title">All pet centers</h2>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading pet centers...</div>
      ) : petCenters.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon"><FontAwesomeIcon icon={faHouse} /></span>
          <h3>No pet centers yet</h3>
          <p>Add your first pet center using the form above.</p>
        </div>
      ) : (
        <div className="crud-list">
          {petCenters.map((center) => (
            <div key={center.PetCenterID} className="card crud-row">
              {editingId === center.PetCenterID ? (
                <>
                  <div className="crud-row-fields">
                    <input type="text" value={editingData.CenterName} onChange={(e) => setEditingData({ ...editingData, CenterName: e.target.value })} />
                    <input type="text" value={editingData.City} onChange={(e) => setEditingData({ ...editingData, City: e.target.value })} />
                    <input type="text" value={editingData.State} onChange={(e) => setEditingData({ ...editingData, State: e.target.value })} />
                    <input type="text" value={editingData.Email} onChange={(e) => setEditingData({ ...editingData, Email: e.target.value })} />
                    <input type="text" value={editingData.PhoneNumber} onChange={(e) => setEditingData({ ...editingData, PhoneNumber: e.target.value })} />
                    <input type="number" value={editingData.CurrentOccupancy} onChange={(e) => setEditingData({ ...editingData, CurrentOccupancy: e.target.value })} />
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleUpdatePetCenter}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="crud-row-info">
                    <strong>{center.CenterName}</strong>
                    <span>{center.City}, {center.State} &middot; {center.Email}</span>
                    <span>{center.PhoneNumber} &middot; Occupancy: {center.CurrentOccupancy}</span>
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => startEditing(center)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeletePetCenter(center.PetCenterID)}>Delete</button>
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

export default PetCenters;
