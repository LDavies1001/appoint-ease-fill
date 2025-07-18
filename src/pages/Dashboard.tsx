import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';
import Header from '@/components/ui/header';

const Dashboard = () => {
  const { user, profile, loading } = useRouteProtection();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Route protection handles redirects, so if we're here, user is authenticated and profile is complete

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {profile.role === 'customer' ? (
        <CustomerDashboard />
      ) : (
        <ProviderDashboard />
      )}
    </div>
  );
};

export default Dashboard;