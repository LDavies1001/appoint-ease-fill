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
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-card via-card/95 to-accent/10 border-b border-border/50 w-full overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-3 opacity-10">
            <img 
              src="/src/assets/openslot-logo.png" 
              alt="OpenSlot" 
              className="h-16 w-16"
            />
            <span className="text-3xl font-bold text-foreground">OpenSlot</span>
          </div>
        </div>
        <div className="relative max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-8 sm:py-12 lg:py-16">
          <div className="text-center space-y-4 lg:space-y-6">
            <div className="space-y-3 lg:space-y-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent break-words px-2">
                {profile.active_role === 'customer' ? 'Customer Dashboard' : 'Provider Dashboard'}
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto font-medium px-2 break-words">
                {profile.active_role === 'customer' 
                  ? 'Manage your bookings, appointments, and service preferences'
                  : 'Manage your business, services, and customer relationships'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

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