import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  // If there is no user, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If a specific role is required, check for it
  if (requiredRole === 'admin' && !user.isAdmin) {
    // If user is not admin, redirect them away
    return <Navigate to="/menu" />;
  }

  // If all checks pass, render the child route
  return <Outlet />;
};

export default ProtectedRoute;
