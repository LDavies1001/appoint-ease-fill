import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import BusinessProfileForm from '@/components/business/BusinessProfileForm';


const CreateBusinessProfile = () => {
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
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
              county: '',
              postcode: '',
              country: 'United Kingdom',
              is_public: false // Default to private for safety
            };
          }
          
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
          county: '',
          postcode: '',
          country: 'United Kingdom',
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5 overflow-x-hidden">
      {/* Provider Hero Banner */}
      <div className="relative bg-gradient-to-r from-provider via-provider/95 to-provider-glow/20 text-white overflow-hidden w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(120,198,140,0.1),_transparent_50%)]"></div>
        <div className="relative w-full px-4 py-8 sm:py-12 lg:py-16">
          <div className="text-center space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/30">
                <span className="text-xs sm:text-sm font-medium">Provider Setup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                {hasExistingProfile ? 'Edit Your Business Profile' : 'Create Your Business Profile'}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-white/90 leading-relaxed mx-auto font-medium px-4">
                {hasExistingProfile 
                  ? 'Update your business information and reach more customers'
                  : 'Set up your business profile and start filling empty slots with new customers'
                }
              </p>
            </div>
            <div className="pt-2 sm:pt-4">
              <div className="inline-flex items-center gap-2 text-white/80 flex-wrap justify-center">
                <div className="w-2 h-2 rounded-full bg-provider-glow animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-center">Fill empty slots • Grow your business • Instant bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="w-full px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 max-w-6xl mx-auto">
        <BusinessProfileForm 
          mode={hasExistingProfile ? 'edit' : 'create'}
          existingData={existingProfile}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default CreateBusinessProfile;