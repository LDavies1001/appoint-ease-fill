import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useRouteProtection = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) return;

    // Save current route to localStorage before any redirects
    if (user && location.pathname !== '/auth') {
      localStorage.setItem('lastRoute', location.pathname);
    }

    // If not authenticated, redirect to auth (except for public routes)
    if (!user && !['/auth', '/'].includes(location.pathname)) {
      navigate('/auth');
      return;
    }

    // If authenticated but no profile, something went wrong - redirect to auth
    if (user && !profile && !['/auth'].includes(location.pathname)) {
      navigate('/auth');
      return;
    }

    // If authenticated and has profile
    if (user && profile) {
      // If user is on auth page, redirect to appropriate page
      if (location.pathname === '/auth') {
        // Check if profile is incomplete
        if (!profile.is_profile_complete) {
          // Redirect based on user role
          if (profile.role === 'provider') {
            navigate('/create-business-profile');
          } else {
            navigate('/onboarding');
          }
        } else {
          // Restore last route or go to dashboard
          const lastRoute = localStorage.getItem('lastRoute');
          if (lastRoute && lastRoute !== '/auth' && lastRoute !== '/onboarding') {
            navigate(lastRoute);
          } else {
            navigate('/dashboard');
          }
        }
        return;
      }

      // If profile is incomplete and not on the appropriate onboarding page, redirect
      if (!profile.is_profile_complete) {
        if (profile.role === 'provider' && location.pathname !== '/create-business-profile') {
          navigate('/create-business-profile');
          return;
        } else if (profile.role === 'customer' && location.pathname !== '/onboarding') {
          navigate('/onboarding');
          return;
        }
      }

      // If profile is complete and on onboarding pages, redirect to dashboard or last route
      if (profile.is_profile_complete && ['/onboarding', '/create-business-profile'].includes(location.pathname)) {
        const lastRoute = localStorage.getItem('lastRoute');
        if (lastRoute && !['/auth', '/onboarding', '/create-business-profile'].includes(lastRoute)) {
          navigate(lastRoute);
        } else {
          navigate('/dashboard');
        }
        return;
      }
    }

    // If not authenticated and on auth page, check for return route
    if (!user && location.pathname === '/auth') {
      // Clear any saved routes when logging out
      localStorage.removeItem('lastRoute');
    }
  }, [user, profile, loading, location.pathname, navigate]);

  return { user, profile, loading };
};