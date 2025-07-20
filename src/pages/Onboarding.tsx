import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/ui/header';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';

const Onboarding = () => {
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
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

    // If user is a provider, redirect to business profile creation
    if (profile.role === 'provider') {
      navigate('/create-business-profile');
      return;
    }
  }, [user, profile, navigate]);

  const uploadPhotoToStorage = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  };

  const handleCustomerProfileSubmit = async (customerData: any) => {
    setLoading(true);
    setUploadingPhoto(true);

    try {
      let profilePhotoUrl = '';

      // Upload profile photo if provided
      if (customerData.profile_photo) {
        profilePhotoUrl = await uploadPhotoToStorage(
          customerData.profile_photo, 
          'profile-photos', 
          user!.id
        );
      }

      setUploadingPhoto(false);

      // Update profile with customer data
      const profileUpdates = {
        name: customerData.full_name,
        phone: customerData.phone,
        location: customerData.location,
        bio: customerData.bio,
        avatar_url: profilePhotoUrl || profile?.avatar_url,
        privacy_settings: customerData.privacy_settings,
        gdpr_consent: customerData.gdpr_consent,
        terms_accepted: customerData.terms_accepted,
        consent_date: new Date().toISOString(),
        is_profile_complete: true
      };

      const { error: profileError } = await updateProfile(profileUpdates);
      if (profileError) throw profileError;

      // Clear any saved onboarding data
      if (user?.id) {
        localStorage.removeItem(`onboarding_form_${user.id}`);
        localStorage.removeItem(`onboarding_step_${user.id}`);
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to OpenSlot. You can now start booking appointments!",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast({
        title: "Error completing profile",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

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

  // If user is a provider, they shouldn't see this page
  if (profile.role === 'provider') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to business setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Complete Your Profile
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Tell us a bit about yourself to get personalized recommendations and help businesses provide better service.
            </p>
          </div>

          {/* Loading indicator */}
          {(loading || uploadingPhoto) && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">
                  {uploadingPhoto ? 'Uploading photo...' : 'Saving profile...'}
                </span>
              </div>
            </div>
          )}

          {/* Customer Profile Form */}
          <CustomerProfileForm
            initialData={{
              full_name: profile.name || '',
              email: profile.email || user.email || '',
              phone: profile.phone || '',
              location: profile.location || '',
              bio: profile.bio || '',
              privacy_settings: profile.privacy_settings,
              gdpr_consent: profile.gdpr_consent || false,
              terms_accepted: profile.terms_accepted || false
            }}
            onSubmit={handleCustomerProfileSubmit}
            isLoading={loading}
            isEdit={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;