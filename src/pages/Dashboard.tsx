import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile.is_profile_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {profile.role === 'customer' ? (
        <CustomerDashboard />
      ) : (
        <ProviderDashboard />
      )}
    </div>
  );
};

export default Dashboard;