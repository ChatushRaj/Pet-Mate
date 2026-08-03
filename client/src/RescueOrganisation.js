import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding } from '@fortawesome/free-solid-svg-icons';
import {
  getRescueOrganizations,
  addRescueOrganization,
  updateRescueOrganization,
  deleteRescueOrganization,
} from './api';
import './crud.css';

const emptyOrg = {
  OrgName: '',
  Email: '',
  Location: '',
  PhoneNumber: '',
  username: '',
  password: '',
};

const RescueOrganizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOrganization, setNewOrganization] = useState(emptyOrg);
  const [editMode, setEditMode] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const data = await getRescueOrganizations();
      setOrganizations(data);
      setError('');
    } catch (err) {
      setError('Could not load rescue organizations. Please try again.');
    }
    setLoading(false);
  };

  const handleAddOrganization = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await addRescueOrganization(newOrganization);
      setOrganizations([...organizations, data]);
      setCreatedCredentials({ name: data.OrgName, username: data.username });
      setNewOrganization(emptyOrg);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this rescue organization. Please try again.');
    }
  };

  const handleDeleteOrganization = async (id) => {
    try {
      await deleteRescueOrganization(id);
      setOrganizations(organizations.filter((org) => org.RescueOrgID !== id));
    } catch (err) {
      setError('Could not delete this rescue organization. Please try again.');
    }
  };

  const handleEditOrganization = (organization) => {
    setEditMode(organization.RescueOrgID);
    setCreatedCredentials(null);
    setNewOrganization({
      OrgName: organization.OrgName,
      Email: organization.Email,
      Location: organization.Location,
      PhoneNumber: organization.PhoneNumber,
      username: '',
      password: '',
    });
  };

  const handleUpdateOrganization = async () => {
    try {
      const { OrgName, Email, Location, PhoneNumber } = newOrganization;
      await updateRescueOrganization(editMode, { OrgName, Email, Location, PhoneNumber });
      setOrganizations(organizations.map((org) => (
        org.RescueOrgID === editMode ? { ...org, OrgName, Email, Location, PhoneNumber } : org
      )));
      setNewOrganization(emptyOrg);
      setEditMode(null);
    } catch (err) {
      setError('Could not update this rescue organization. Please try again.');
    }
  };

  const handleChange = (e) => {
    setNewOrganization({ ...newOrganization, [e.target.name]: e.target.value });
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Rescue Organizations</h1>
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
        <h2>{editMode ? 'Edit organization' : 'Add a new organization'}</h2>
        <form className="crud-form-grid" onSubmit={editMode ? (e) => { e.preventDefault(); handleUpdateOrganization(); } : handleAddOrganization}>
          <div className="field">
            <label>Name</label>
            <input type="text" name="OrgName" value={newOrganization.OrgName} onChange={handleChange} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="text" name="Email" value={newOrganization.Email} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Location</label>
            <input type="text" name="Location" value={newOrganization.Location} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="text" name="PhoneNumber" value={newOrganization.PhoneNumber} onChange={handleChange} />
          </div>
          {!editMode && (
            <>
              <div className="field">
                <label>Login username</label>
                <input type="text" name="username" value={newOrganization.username} onChange={handleChange} required />
              </div>
              <div className="field">
                <label>Login password</label>
                <input type="password" name="password" value={newOrganization.password} onChange={handleChange} required minLength={6} />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary crud-form-submit">
            {editMode ? 'Save changes' : 'Add organization + login'}
          </button>
          {editMode && (
            <button
              type="button"
              className="btn btn-secondary crud-form-submit"
              onClick={() => { setEditMode(null); setNewOrganization(emptyOrg); }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <h2 className="crud-section-title">All organizations</h2>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading organizations...</div>
      ) : organizations.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon"><FontAwesomeIcon icon={faBuilding} /></span>
          <h3>No rescue organizations yet</h3>
          <p>Add your first organization using the form above.</p>
        </div>
      ) : (
        <div className="crud-list">
          {organizations.map((organization) => (
            <div key={organization.RescueOrgID} className="card crud-row">
              <div className="crud-row-info">
                <strong>{organization.OrgName}</strong>
                <span>{organization.Email} &middot; {organization.PhoneNumber}</span>
                <span>{organization.Location}</span>
              </div>
              <div className="crud-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => handleEditOrganization(organization)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOrganization(organization.RescueOrgID)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RescueOrganizations;
