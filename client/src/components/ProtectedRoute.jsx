import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#5F6A61]">
          Restoring secure session...
        </span>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}
