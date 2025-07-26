import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import Header from '@/components/ui/header';

const Onboarding = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Use route protection to handle auth state and redirects
  useRouteProtection();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    // If profile is complete, redirect to dashboard
    if (profile.is_profile_complete) {
      navigate('/dashboard');
      return;
    }
  }, [user, profile, navigate]);

  // Show loading state while auth is being determined
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If profile is already complete, show loading while redirecting
  if (profile.is_profile_complete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine initial role based on profile
  const initialRole = profile.role !== 'customer' && profile.role !== 'provider' 
    ? undefined 
    : profile.role;

  return (
    <>
      <Header />
      <OnboardingFlow initialRole={initialRole} />
    </>
  );
};

export default Onboarding;