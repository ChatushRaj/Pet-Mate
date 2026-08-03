import axios from 'axios';

// Base URL is configurable via .env (REACT_APP_API_URL) so the built app
// can point at a different backend in production without code changes.
// Falls back to localhost for local development.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9800';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT token to every outgoing request automatically, instead
// of every component having to remember to add the Authorization header
// itself (several of the older components didn't, which meant their
// requests were silently rejected with 401s).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petmate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear it and send the user back to
// login instead of leaving the app stuck in a broken logged-in state.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('petmate_token');
      localStorage.removeItem('petmate_user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
export const login = (username, password) =>
  api.post('/api/login', { username, password }).then((res) => res.data);

export const getProfile = () => api.get('/api/profile').then((res) => res.data);

// ---------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------
export const getDashboardStats = () => api.get('/api/dashboard-stats').then((res) => res.data);

// ---------------------------------------------------------------------
// Pets
// ---------------------------------------------------------------------
export const getPets = () => api.get('/api/pets').then((res) => res.data);
export const getAvailablePets = () => api.get('/api/available-pets').then((res) => res.data);
export const addPet = (pet) => api.post('/api/pets', pet).then((res) => res.data);
export const updatePet = (petId, updates) => api.put(`/api/pets/${petId}`, updates).then((res) => res.data);
export const deletePet = (petId) => api.delete(`/api/pets/${petId}`).then((res) => res.data);
export const assignPetToCenter = (petId, petCenterId) =>
  api.post(`/api/pets/${petId}/assign-to-center`, { pet_center_id: petCenterId }).then((res) => res.data);

// ---------------------------------------------------------------------
// Volunteers
// ---------------------------------------------------------------------
export const getVolunteers = () => api.get('/api/volunteers').then((res) => res.data);
export const addVolunteer = (volunteer) => api.post('/api/volunteers', volunteer).then((res) => res.data);
export const updateVolunteer = (id, updates) => api.put(`/api/volunteers/${id}`, updates).then((res) => res.data);
export const deleteVolunteer = (id) => api.delete(`/api/volunteers/${id}`).then((res) => res.data);

// ---------------------------------------------------------------------
// Adopters
// ---------------------------------------------------------------------
export const getAdopters = () => api.get('/api/adopters').then((res) => res.data);
export const addAdopter = (adopter) => api.post('/api/adopters', adopter).then((res) => res.data);
export const updateAdopter = (id, updates) => api.put(`/api/adopters/${id}`, updates).then((res) => res.data);
export const deleteAdopter = (id) => api.delete(`/api/adopters/${id}`).then((res) => res.data);

// ---------------------------------------------------------------------
// Adoptions
// ---------------------------------------------------------------------
export const getAdoptions = () => api.get('/api/adoptions').then((res) => res.data);
export const recordAdoption = (adoption) => api.post('/api/adoptions', adoption).then((res) => res.data);

// ---------------------------------------------------------------------
// Rescue organizations (admin)
// ---------------------------------------------------------------------
export const getRescueOrganizations = () => api.get('/api/rescue-organizations').then((res) => res.data);
export const addRescueOrganization = (org) => api.post('/api/rescue-organizations', org).then((res) => res.data);
export const updateRescueOrganization = (id, updates) =>
  api.put(`/api/rescue-organizations/${id}`, updates).then((res) => res.data);
export const deleteRescueOrganization = (id) => api.delete(`/api/rescue-organizations/${id}`).then((res) => res.data);

// ---------------------------------------------------------------------
// Pet centers (admin)
// ---------------------------------------------------------------------
export const getPetCenters = () => api.get('/api/pet-centers').then((res) => res.data);
export const addPetCenter = (center) => api.post('/api/pet-centers', center).then((res) => res.data);
export const updatePetCenter = (id, updates) => api.put(`/api/pet-centers/${id}`, updates).then((res) => res.data);
export const deletePetCenter = (id) => api.delete(`/api/pet-centers/${id}`).then((res) => res.data);

export default api;
