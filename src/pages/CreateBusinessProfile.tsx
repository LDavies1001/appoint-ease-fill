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
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setExistingProfile(data);
      }
    } catch (error) {
      console.error('Error checking existing profile:', error);
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