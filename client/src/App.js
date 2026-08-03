// App.js - PetMate with Role-Based Routing
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

import Login from './login';
import AdminDashboard from './AdminDashboard';
import RescueDashboard from './RescueDashboard';
import CenterDashboard from './CenterDashboard';
import AdminOverview from './AdminOverview';
import AdminAdoptions from './AdminAdoptions';

// Import existing components for admin management
import Volunteers from './Volunteers';
import Pet from './Pet';
import PetCentre from './PetCentre';
import RescueOrganisation from './RescueOrganisation';
import Adopter from './Adopter';

// Authentication wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('petmate_token');
  const user = JSON.parse(localStorage.getItem('petmate_user') || '{}');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        
        {/* Role-Based Dashboard Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/rescue-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['rescue_org']}>
              <RescueDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/center-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['pet_center']}>
              <CenterDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Management Routes */}
        <Route 
          path="/admin/rescue-organizations" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RescueOrganisation />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/pet-centers" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PetCentre />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/adoptions" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAdoptions />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/overview" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminOverview />
            </ProtectedRoute>
          } 
        />
        
        {/* Legacy Routes (for backward compatibility) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Navigate to="/admin-dashboard" replace />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/volunteers" 
          element={
            <ProtectedRoute allowedRoles={['pet_center']}>
              <Volunteers />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pet" 
          element={
            <ProtectedRoute allowedRoles={['rescue_org', 'pet_center']}>
              <Pet />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/pet-centre" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PetCentre />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/rescue-organisation" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RescueOrganisation />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/adopter" 
          element={
            <ProtectedRoute allowedRoles={['pet_center']}>
              <Adopter />
            </ProtectedRoute>
          } 
        />
        
        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

// Error Pages
const UnauthorizedPage = () => (
  <div className="status-page">
    <span className="status-page-icon"><FontAwesomeIcon icon={faBan} /></span>
    <h1>Unauthorized access</h1>
    <p>You don't have permission to access this page.</p>
    <button onClick={() => window.location.href = '/'} className="btn btn-primary">
      Back to login
    </button>
  </div>
);

const NotFoundPage = () => (
  <div className="status-page">
    <span className="status-page-icon"><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
    <h1>Page not found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <button onClick={() => window.location.href = '/'} className="btn btn-primary">
      Back to login
    </button>
  </div>
);

export default App;
