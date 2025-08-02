import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import ProviderDashboard from '@/components/dashboard/ProviderDashboard';


const Dashboard = () => {
  const { user, profile, loading } = useRouteProtection();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Additional safety check for profile
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Route protection handles redirects, so if we're here, user is authenticated and profile is complete

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 overflow-x-hidden w-full">

      {/* Dashboard Content */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border border-border/50 backdrop-blur-sm overflow-hidden">
          {profile.active_role === 'customer' ? (
            <CustomerDashboard />
          ) : (
            <ProviderDashboard />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;