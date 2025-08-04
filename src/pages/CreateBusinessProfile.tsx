import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import MobileBusinessProfileForm from '@/components/business/MobileBusinessProfileForm';


const CreateBusinessProfile = () => {
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('CreateBusinessProfile - Auth state:', { 
      hasUser: !!user, 
      hasProfile: !!profile, 
      profileRole: profile?.role, 
      profileComplete: profile?.is_profile_complete,
      pathname: window.location.pathname
    });
    
    if (!user || !profile) {
      console.log('CreateBusinessProfile - Redirecting to auth - missing user or profile');
      navigate('/auth');
      return;
    }

    if (profile.role !== 'provider') {
      console.log('CreateBusinessProfile - Redirecting to dashboard - not a provider, role:', profile.role);
      navigate('/dashboard');
      return;
    }

    console.log('CreateBusinessProfile - Starting profile check for user:', user.id);
    checkExistingProfile();
  }, [user, profile, navigate]);

  const checkExistingProfile = async () => {
    try {
      // First check for existing provider details
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (providerError && providerError.code !== 'PGRST116') {
        throw providerError;
      }
      
      // If provider details exist, use them for editing
      if (providerData) {
        setExistingProfile(providerData);
        setHasExistingProfile(true);
      } else {
        // Prepare initial data from signup information for new profile creation
        const parseLocationToAddress = (location?: string) => {
          if (!location) {
            return {
              address_line_1: '',
              address_line_2: '',
              town_city: '',
              postcode: '',
              is_public: false // Default to private for safety
            };
          }
          
          return {
            address_line_1: location,
            address_line_2: '',
            town_city: '',
            postcode: '',
            is_public: false // Default to private for safety
          };
        };

        const signupData = {
          business_name: user?.user_metadata?.business_name || profile?.business_name || '',
          business_phone: profile?.phone || user?.user_metadata?.phone || '',
          business_address: parseLocationToAddress(profile?.location || user?.user_metadata?.location),
          business_categories: []
        };
        
        setExistingProfile(signupData);
        setHasExistingProfile(false);
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
      // Fallback data for new profile creation
      const fallbackData = {
        business_name: user?.user_metadata?.business_name || profile?.business_name || '',
        business_phone: profile?.phone || user?.user_metadata?.phone || '',
        business_address: {
          address_line_1: profile?.location || user?.user_metadata?.location || '',
          address_line_2: '',
          town_city: '',
          postcode: '',
          is_public: false // Default to private for safety
        },
        business_categories: []
      };
      setExistingProfile(fallbackData);
      setHasExistingProfile(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MobileBusinessProfileForm 
      mode={hasExistingProfile ? 'edit' : 'create'}
      existingData={existingProfile}
      onSuccess={handleSuccess}
    />
  );
};

export default CreateBusinessProfile;