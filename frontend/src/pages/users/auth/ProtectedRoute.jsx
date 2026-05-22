import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, logout } from './authStorage';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  if (!isAuthenticated()) {
    logout({ sessionExpired: Boolean(localStorage.getItem('asset_management_auth_token')) });
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
