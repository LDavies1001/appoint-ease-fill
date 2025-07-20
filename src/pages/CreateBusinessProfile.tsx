import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BusinessProfileForm from '@/components/business/BusinessProfileForm';
import Header from '@/components/ui/header';

const CreateBusinessProfile = () => {
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.role !== 'provider') {
      navigate('/dashboard');
      return;
    }

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
      
      // Prepare initial data from signup information
      const parseLocationToAddress = (location?: string) => {
        if (!location) {
          return {
            address_line_1: '',
            address_line_2: '',
            town_city: '',
            county: '',
            postcode: '',
            country: 'United Kingdom',
            is_public: false // Default to private for safety
          };
        }
        
        // Try to parse the location string into address components
        // For now, put the whole location in address_line_1 as fallback
        return {
          address_line_1: location,
          address_line_2: '',
          town_city: '',
          county: '',
          postcode: '',
          country: 'United Kingdom',
          is_public: false // Default to private for safety
        };
      };

      const signupData = {
        business_name: user?.user_metadata?.business_name || profile?.business_name || '',
        business_phone: profile?.phone || user?.user_metadata?.phone || '',
        business_address: parseLocationToAddress(profile?.location || user?.user_metadata?.location),
        business_categories: []
      };

      // If provider details exist, merge with signup data (provider details take precedence)
      if (providerData) {
        const mergedData = {
          ...signupData,
          ...providerData,
          // Convert services_offered array to business_categories if it exists
          business_categories: providerData.services_offered || []
        };
        setExistingProfile(mergedData);
      } else {
        // Use signup data as initial form data
        setExistingProfile(signupData);
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
      // Still set signup data even if there's an error
      const fallbackData = {
        business_name: user?.user_metadata?.business_name || profile?.business_name || '',
        business_phone: profile?.phone || user?.user_metadata?.phone || '',
        business_address: {
          address_line_1: profile?.location || user?.user_metadata?.location || '',
          address_line_2: '',
          town_city: '',
          county: '',
          postcode: '',
          country: 'United Kingdom',
          is_public: false // Default to private for safety
        },
        business_categories: []
      };
      setExistingProfile(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    navigate('/business-profile');
  };

  if (loading) {
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

  return (
    <>
      <Header />
      <BusinessProfileForm 
        mode={existingProfile ? 'edit' : 'create'}
        existingData={existingProfile}
        onSuccess={handleSuccess}
      />
    </>
  );
};

export default CreateBusinessProfile;