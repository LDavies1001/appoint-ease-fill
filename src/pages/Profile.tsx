import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Shield, Clock, MapPin, Star, Award, Camera, ExternalLink, Calendar, User } from 'lucide-react';
import Header from '@/components/ui/header';

import { PersonalInfoSection } from '@/components/business/PersonalInfoSection';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';
import { BusinessLocationSection } from '@/components/business/BusinessLocationSection';
import { OperatingHoursSection } from '@/components/business/OperatingHoursSection';
import { BusinessBrandingSection } from '@/components/business/BusinessBrandingSection';
import { CertificationsSection } from '@/components/business/CertificationsSection';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';

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
  business_logo_url: string;
  cover_image_url: string;
  services_offered: string[];
  business_categories: any[];
  certifications: string;
  insurance_info: string;
  certification_files: string[];
  awards_recognitions: string;
  professional_memberships: string;
  other_qualifications: string;
  pricing_info: string;
  profile_published: boolean;
  rating: number;
  total_reviews: number;
  social_media_connections: any[];
}

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    availability_notes: '',
    business_logo_url: '',
    cover_image_url: '',
    services_offered: [],
    business_categories: [],
    certifications: '',
    insurance_info: '',
    certification_files: [],
    awards_recognitions: '',
    professional_memberships: '',
    other_qualifications: '',
    pricing_info: '',
    profile_published: false,
    rating: 0,
    total_reviews: 0,
    social_media_connections: []
  });

  // Use route protection to handle auth state and redirects
  useRouteProtection();

  useEffect(() => {
    if (user && profile) {
      fetchProfileData();
    }
  }, [user, profile]);

  const fetchProfileData = async () => {
    if (!user?.id) return;

    try {
      // Fetch personal profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
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

      // For providers, also fetch business data
      if (profile?.role === 'provider') {
        const { data: businessDetails, error: businessError } = await supabase
          .from('provider_details')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (businessError) throw businessError;

        if (businessDetails) {
          // Parse operating hours safely
          let parsedOperatingHours = getDefaultOperatingHours();
          if (businessDetails.operating_hours) {
            try {
              parsedOperatingHours = JSON.parse(businessDetails.operating_hours);
            } catch (e) {
              console.warn('Failed to parse operating hours:', e);
            }
          }

          // Fetch social media connections
          const { data: socialConnections, error: socialError } = await supabase
            .from('social_media_connections')
            .select('*')
            .eq('provider_id', user.id)
            .eq('is_active', true);

          if (socialError) {
            console.warn('Failed to fetch social connections:', socialError);
          }

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
            operating_hours: parsedOperatingHours,
            availability_notes: businessDetails.availability_notes || '',
            business_logo_url: businessDetails.business_logo_url || '',
            cover_image_url: businessDetails.cover_image_url || '',
            services_offered: businessDetails.services_offered || [],
            business_categories: [],
            certifications: businessDetails.certifications || '',
            insurance_info: businessDetails.insurance_info || '',
            certification_files: businessDetails.certification_files || [],
            awards_recognitions: businessDetails.awards_recognitions || '',
            professional_memberships: businessDetails.professional_memberships || '',
            other_qualifications: businessDetails.other_qualifications || '',
            pricing_info: businessDetails.pricing_info || '',
            profile_published: businessDetails.profile_published || false,
            rating: businessDetails.rating || 0,
            total_reviews: businessDetails.total_reviews || 0,
            social_media_connections: socialConnections || []
          });
        }
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
        variant: "destructive"
      });
    }
  };

  const handlePersonalUpdate = async (updatedData: Partial<PersonalData>) => {
    setPersonalData(prev => ({ ...prev, ...updatedData }));
    await fetchProfileData(); // Refresh data after update
  };

  const handleBusinessUpdate = async (updatedData: Partial<BusinessData>) => {
    setBusinessData(prev => ({ ...prev, ...updatedData }));
    await fetchProfileData(); // Refresh data after update
  };

  const handleCustomerProfileSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.full_name,
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          privacy_settings: data.privacy_settings,
          gdpr_consent: data.gdpr_consent,
          terms_accepted: data.terms_accepted,
          is_profile_complete: true,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Customer Profile View
  if (profile.role === 'customer') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  My Profile
                </h1>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
              
              <CustomerProfileForm
                initialData={{
                  full_name: profile.name || '',
                  email: profile.email,
                  phone: profile.phone || '',
                  location: profile.location || '',
                  bio: profile.bio || '',
                  privacy_settings: profile.privacy_settings || {
                    phone_visible: true,
                    email_visible: false,
                    location_visible: true,
                  },
                  gdpr_consent: profile.gdpr_consent || false,
                  terms_accepted: profile.terms_accepted || false,
                }}
                onSubmit={handleCustomerProfileSubmit}
                isEdit={true}
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Provider Profile View - Full Dashboard Interface
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Business Profile</h1>
            <p className="text-muted-foreground">Manage your business information and settings</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/business/${user?.id}`)}
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Public View
            </Button>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-8 p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={personalData.avatar_url} alt={personalData.name} />
              <AvatarFallback className="text-xl">{personalData.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{businessData.business_name || personalData.name}</h2>
              <p className="text-muted-foreground">{businessData.business_description || personalData.bio}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={businessData.profile_published ? "default" : "secondary"}>
                  {businessData.profile_published ? "Published" : "Draft"}
                </Badge>
                {businessData.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{businessData.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({businessData.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Editable Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <PersonalInfoSection
            data={personalData}
            userId={profile?.user_id || ''}
            onUpdate={handlePersonalUpdate}
          />

          {/* Business Branding Section - Editable */}
          <div className="lg:col-span-2">
            <BusinessBrandingSection
              data={{
                business_logo_url: businessData.business_logo_url,
                cover_image_url: businessData.cover_image_url,
                business_name: businessData.business_name
              }}
              userId={profile?.user_id || ''}
              onUpdate={handleBusinessUpdate}
            />
          </div>

          {/* Certifications Section - Editable */}
          <div className="lg:col-span-2">
            <CertificationsSection
              data={{
                certifications: businessData.certifications || '',
                insurance_info: businessData.insurance_info || '',
                certification_files: businessData.certification_files || [],
                awards_recognitions: businessData.awards_recognitions || '',
                professional_memberships: businessData.professional_memberships || '',
                other_qualifications: businessData.other_qualifications || ''
              }}
              userId={profile?.user_id || ''}
              userEmail={profile?.email}
              onUpdate={handleBusinessUpdate}
            />
          </div>

          {/* Business Information */}
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
            userEmail={profile?.email}
            onUpdate={handleBusinessUpdate}
          />

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

          <OperatingHoursSection
            data={{
              operating_hours: businessData.operating_hours,
              availability_notes: businessData.availability_notes
            }}
            userId={profile?.user_id || ''}
            onUpdate={handleBusinessUpdate}
          />

          <div className="lg:col-span-2">
            <SocialMediaSection
              data={{
                facebook_url: businessData.facebook_url,
                instagram_url: businessData.instagram_url,
                tiktok_url: businessData.tiktok_url,
                social_media_connections: businessData.social_media_connections
              }}
              userId={profile?.user_id || ''}
              onUpdate={handleBusinessUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;