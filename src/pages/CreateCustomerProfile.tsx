import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';

const CreateCustomerProfile = () => {
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

    if (profile.role !== 'customer') {
      navigate('/dashboard');
      return;
    }

    checkExistingProfile();
  }, [user, profile, navigate]);

  const checkExistingProfile = async () => {
    try {
      // Check if profile is already complete
      if (profile?.is_profile_complete) {
        setHasExistingProfile(true);
        setExistingProfile({
          name: profile.name,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          privacy_settings: profile.privacy_settings,
          gdpr_consent: profile.gdpr_consent,
          terms_accepted: profile.terms_accepted
        });
      } else {
        // Prepare initial data from signup information for new profile creation
        const signupData = {
          name: profile?.name || user?.user_metadata?.full_name || '',
          phone: profile?.phone || user?.user_metadata?.phone || '',
          location: profile?.location || user?.user_metadata?.location || '',
          bio: '',
          avatar_url: '',
          privacy_settings: {
            phone_visible: true,
            email_visible: false,
            location_visible: true
          },
          gdpr_consent: false,
          terms_accepted: false
        };
        
        setExistingProfile(signupData);
        setHasExistingProfile(false);
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
      // Fallback data for new profile creation
      const fallbackData = {
        name: profile?.name || user?.user_metadata?.full_name || '',
        phone: profile?.phone || user?.user_metadata?.phone || '',
        location: profile?.location || user?.user_metadata?.location || '',
        bio: '',
        avatar_url: '',
        privacy_settings: {
          phone_visible: true,
          email_visible: false,
          location_visible: true
        },
        gdpr_consent: false,
        terms_accepted: false
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-accent/20 overflow-x-hidden w-full">
      {/* Profile Form */}
      <div className="px-4 py-8 relative z-10">
        <CustomerProfileForm 
          mode={hasExistingProfile ? 'edit' : 'create'}
          existingData={existingProfile}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default CreateCustomerProfile;