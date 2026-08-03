import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getAdoptions } from './api';
import './crud.css';

const AdminAdoptions = () => {
  const navigate = useNavigate();
  const [adoptions, setAdoptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getAdoptions();
        setAdoptions(data);
      } catch (err) {
        setError('Could not load adoption records. Please try again.');
      }
      setLoading(false);
    })();
  }, []);

  const filtered = statusFilter === 'all' ? adoptions : adoptions.filter((a) => a.status === statusFilter);

  return (
    <div className="crud-page">
      <div className="crud-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin-dashboard')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1>Adoption Records</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)', display: 'flex', gap: 'var(--space-2)' }}>
        {['all', 'completed', 'pending'].map((s) => (
          <button
            key={s}
            className={s === statusFilter ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading adoption records...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <h3>No adoption records</h3>
          <p>No adoptions match this filter yet.</p>
        </div>
      ) : (
        <div className="adoptions-table">
          <table>
            <thead>
              <tr>
                <th>Pet</th>
                <th>Adopter</th>
                <th>Pet Center</th>
                <th>Volunteer</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.adoption_id}>
                  <td>{a.PetName}</td>
                  <td>{a.AdopterName || 'N/A'}</td>
                  <td>{a.pet_center || 'N/A'}</td>
                  <td>{a.VolunteerName || 'N/A'}</td>
                  <td>{new Date(a.adoption_date).toLocaleDateString()}</td>
                  <td><span className={`status ${a.status}`}>{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAdoptions;
