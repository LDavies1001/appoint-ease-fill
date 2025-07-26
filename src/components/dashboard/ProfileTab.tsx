import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { PersonalInfoSection } from '@/components/business/PersonalInfoSection';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';
import { BusinessLocationSection } from '@/components/business/BusinessLocationSection';
import { OperatingHoursSection } from '@/components/business/OperatingHoursSection';

interface PersonalData {
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
}

interface OperatingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface BusinessData {
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  business_website: string;
  business_address: string;
  business_street: string;
  business_city: string;
  business_county: string;
  business_postcode: string;
  business_country: string;
  is_address_public: boolean;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  years_experience: number;
  service_area: string;
  operating_hours: OperatingHours;
  availability_notes: string;
}

const ProfileTab = () => {
  const [personalData, setPersonalData] = useState<PersonalData>({
    name: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: ''
  });

  const getDefaultOperatingHours = (): OperatingHours => ({
    monday: { open: '09:00', close: '17:00', closed: false },
    tuesday: { open: '09:00', close: '17:00', closed: false },
    wednesday: { open: '09:00', close: '17:00', closed: false },
    thursday: { open: '09:00', close: '17:00', closed: false },
    friday: { open: '09:00', close: '17:00', closed: false },
    saturday: { open: '09:00', close: '17:00', closed: true },
    sunday: { open: '09:00', close: '17:00', closed: true }
  });

  const [businessData, setBusinessData] = useState<BusinessData>({
    business_name: '',
    business_description: '',
    business_email: '',
    business_phone: '',
    business_website: '',
    business_address: '',
    business_street: '',
    business_city: '',
    business_county: '',
    business_postcode: '',
    business_country: '',
    is_address_public: false,
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    years_experience: 0,
    service_area: '',
    operating_hours: getDefaultOperatingHours(),
    availability_notes: ''
  });

  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.user_id) {
      fetchAllData();
    }
  }, [profile]);

  const fetchAllData = async () => {
    if (!profile?.user_id) return;

    try {
      // Fetch personal profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name, phone, location, bio, avatar_url')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setPersonalData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || ''
        });
      }

      // Fetch business data if user is a provider
      if (profile.active_role === 'provider') {
        const { data: businessDetails, error: businessError } = await supabase
          .from('provider_details')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        if (businessError) throw businessError;

        if (businessDetails) {
          // Parse operating hours
          const parseOperatingHours = (hoursStr?: string): OperatingHours => {
            if (!hoursStr) return getDefaultOperatingHours();
            
            try {
              const lines = hoursStr.split('\n');
              const hours: OperatingHours = getDefaultOperatingHours();
              const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
              
              lines.forEach((line, index) => {
                if (index < dayNames.length) {
                  const dayKey = dayNames[index] as keyof OperatingHours;
                  if (line.includes('Closed')) {
                    hours[dayKey].closed = true;
                  } else {
                    const match = line.match(/(\d{2}:\d{2}) - (\d{2}:\d{2})/);
                    if (match) {
                      hours[dayKey].open = match[1];
                      hours[dayKey].close = match[2];
                      hours[dayKey].closed = false;
                    }
                  }
                }
              });
              
              return hours;
            } catch {
              return getDefaultOperatingHours();
            }
          };

          setBusinessData({
            business_name: businessDetails.business_name || '',
            business_description: businessDetails.business_description || '',
            business_email: businessDetails.business_email || '',
            business_phone: businessDetails.business_phone || '',
            business_website: businessDetails.business_website || '',
            business_address: businessDetails.business_address || '',
            business_street: businessDetails.business_street || '',
            business_city: businessDetails.business_city || '',
            business_county: businessDetails.business_county || '',
            business_postcode: businessDetails.business_postcode || '',
            business_country: businessDetails.business_country || '',
            is_address_public: businessDetails.is_address_public || false,
            facebook_url: businessDetails.facebook_url || '',
            instagram_url: businessDetails.instagram_url || '',
            tiktok_url: businessDetails.tiktok_url || '',
            years_experience: businessDetails.years_experience || 0,
            service_area: businessDetails.service_area || '',
            operating_hours: parseOperatingHours(businessDetails.operating_hours),
            availability_notes: businessDetails.availability_notes || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load your profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalUpdate = (updatedData: Partial<PersonalData>) => {
    setPersonalData(prev => ({ ...prev, ...updatedData }));
  };

  const handleBusinessUpdate = (updatedData: Partial<BusinessData>) => {
    setBusinessData(prev => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your personal and business information. Click the edit button on any section to make changes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <PersonalInfoSection
          data={personalData}
          userId={profile?.user_id || ''}
          onUpdate={handlePersonalUpdate}
        />

        {/* Business Information - Only show for providers */}
        {profile?.active_role === 'provider' && (
          <>
            <BusinessInfoSection
              data={{
                business_name: businessData.business_name,
                business_description: businessData.business_description,
                years_experience: businessData.years_experience,
                service_area: businessData.service_area
              }}
              userId={profile?.user_id || ''}
              onUpdate={handleBusinessUpdate}
            />

            <ContactInfoSection
              data={{
                business_email: businessData.business_email,
                business_phone: businessData.business_phone,
                business_website: businessData.business_website
              }}
              userId={profile?.user_id || ''}
              onUpdate={handleBusinessUpdate}
            />

            <SocialMediaSection
              data={{
                facebook_url: businessData.facebook_url,
                instagram_url: businessData.instagram_url,
                tiktok_url: businessData.tiktok_url
              }}
              userId={profile?.user_id || ''}
              onUpdate={handleBusinessUpdate}
            />

            <div className="lg:col-span-2">
              <OperatingHoursSection
                data={{
                  operating_hours: businessData.operating_hours,
                  availability_notes: businessData.availability_notes
                }}
                userId={profile?.user_id || ''}
                onUpdate={handleBusinessUpdate}
              />
            </div>

            <div className="lg:col-span-2">
              <BusinessLocationSection
                data={{
                  business_address: businessData.business_address,
                  business_street: businessData.business_street,
                  business_city: businessData.business_city,
                  business_county: businessData.business_county,
                  business_postcode: businessData.business_postcode,
                  business_country: businessData.business_country,
                  is_address_public: businessData.is_address_public
                }}
                userId={profile?.user_id || ''}
                onUpdate={handleBusinessUpdate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;