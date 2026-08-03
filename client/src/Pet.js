import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw } from '@fortawesome/free-solid-svg-icons';
import { getPets, addPet, updatePet, deletePet } from './api';
import './crud.css';

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newPet, setNewPet] = useState({
    PetName: '',
    Age: '',
    Breed: '',
    Species: '',
    Size: '',
    PetCondition: '',
  });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const data = await getPets();
      setPets(data);
      setError('');
    } catch (err) {
      setError('Could not load pets. Please try again.');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setNewPet({ ...newPet, [e.target.name]: e.target.value });
  };

  const handleAddPet = async (e) => {
    e.preventDefault();
    try {
      await addPet(newPet);
      setNewPet({ PetName: '', Age: '', Breed: '', Species: '', Size: '', PetCondition: '' });
      fetchPets();
    } catch (err) {
      setError('Could not add this pet. Please check the fields and try again.');
    }
  };

  const handleFieldEdit = (petID, field, value) => {
    setPets(pets.map((p) => (p.pet_id === petID ? { ...p, [field]: value } : p)));
  };

  const handleSavePet = async (pet) => {
    try {
      await updatePet(pet.pet_id, {
        PetName: pet.PetName,
        Age: pet.Age,
        Breed: pet.Breed,
        Species: pet.Species,
        Size: pet.Size,
        PetCondition: pet.PetCondition,
      });
      setEditingId(null);
      fetchPets();
    } catch (err) {
      setError('Could not update this pet. Please try again.');
    }
  };

  const handleDeletePet = async (petID) => {
    try {
      await deletePet(petID);
      fetchPets();
    } catch (err) {
      setError('Could not delete this pet. Please try again.');
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-header">
        <h1>Pets Available for Adoption</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card crud-form-card">
        <h2>Add a new pet</h2>
        <form className="crud-form-grid" onSubmit={handleAddPet}>
          <div className="field">
            <label>Pet name</label>
            <input type="text" name="PetName" value={newPet.PetName} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Age</label>
            <input type="number" name="Age" value={newPet.Age} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Breed</label>
            <input type="text" name="Breed" value={newPet.Breed} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Species</label>
            <input type="text" name="Species" value={newPet.Species} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Size</label>
            <input type="text" name="Size" value={newPet.Size} onChange={handleInputChange} required />
          </div>
          <div className="field">
            <label>Condition</label>
            <input type="text" name="PetCondition" value={newPet.PetCondition} onChange={handleInputChange} required />
          </div>
          <button type="submit" className="btn btn-primary crud-form-submit">Add pet</button>
        </form>
      </div>

      <h2 className="crud-section-title">All pets</h2>

      {loading ? (
        <div className="page-loading"><span className="spinner" /> Loading pets...</div>
      ) : pets.length === 0 ? (
        <div className="empty-state card">
          <span className="empty-icon"><FontAwesomeIcon icon={faPaw} /></span>
          <h3>No pets yet</h3>
          <p>Add your first pet using the form above.</p>
        </div>
      ) : (
        <div className="crud-list">
          {pets.map((pet) => (
            <div key={pet.pet_id} className="card crud-row">
              {editingId === pet.pet_id ? (
                <>
                  <div className="crud-row-fields">
                    <input type="text" value={pet.PetName} onChange={(e) => handleFieldEdit(pet.pet_id, 'PetName', e.target.value)} />
                    <input type="number" value={pet.Age} onChange={(e) => handleFieldEdit(pet.pet_id, 'Age', e.target.value)} />
                    <input type="text" value={pet.Breed} onChange={(e) => handleFieldEdit(pet.pet_id, 'Breed', e.target.value)} />
                    <input type="text" value={pet.Species} onChange={(e) => handleFieldEdit(pet.pet_id, 'Species', e.target.value)} />
                    <input type="text" value={pet.Size} onChange={(e) => handleFieldEdit(pet.pet_id, 'Size', e.target.value)} />
                    <input type="text" value={pet.PetCondition} onChange={(e) => handleFieldEdit(pet.pet_id, 'PetCondition', e.target.value)} />
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleSavePet(pet)}>Save</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditingId(null); fetchPets(); }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="crud-row-info">
                    <strong>{pet.PetName}</strong>
                    <span>{pet.Species} &middot; {pet.Breed} &middot; {pet.Age} yrs &middot; {pet.Size}</span>
                    {pet.status && <span className={`status ${pet.status}`}>{pet.status}</span>}
                  </div>
                  <div className="crud-row-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(pet.pet_id)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeletePet(pet.pet_id)}>Delete</button>
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

export default Pets;
