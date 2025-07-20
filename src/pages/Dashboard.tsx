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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-card via-card/95 to-accent/10 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(120,119,198,0.1),_transparent_50%)]"></div>
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
                {profile.active_role === 'customer' ? 'Customer Dashboard' : 'Provider Dashboard'}
              </h1>
              <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto font-medium">
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
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-3xl p-8 shadow-xl border border-border/50 backdrop-blur-sm">
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