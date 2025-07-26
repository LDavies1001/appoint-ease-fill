import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Shield, Clock, MapPin, Star, Award, Camera, ExternalLink } from 'lucide-react';

import { PersonalInfoSection } from '@/components/business/PersonalInfoSection';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';
import { BusinessLocationSection } from '@/components/business/BusinessLocationSection';
import { OperatingHoursSection } from '@/components/business/OperatingHoursSection';
import { BusinessBrandingSection } from '@/components/business/BusinessBrandingSection';

import { CertificationsSection } from '@/components/business/CertificationsSection';

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
        // Fetch business details
        const { data: businessDetails, error: businessError } = await supabase
          .from('provider_details')
          .select('*')
          .eq('user_id', profile.user_id)
          .maybeSingle();

        // Fetch business categories for services
        const { data: categories, error: categoriesError } = await supabase
          .from('business_categories')
          .select('*');

        // Fetch social media connections
        const { data: socialConnections, error: socialError } = await supabase
          .from('social_media_connections')
          .select('*')
          .eq('provider_id', profile.user_id)
          .eq('is_active', true);

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

          // Map category IDs to category objects
          const businessCategories = businessDetails.services_offered?.map(serviceId => 
            categories?.find(cat => cat.id === serviceId)
          ).filter(Boolean) || [];

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
            availability_notes: businessDetails.availability_notes || '',
            business_logo_url: businessDetails.business_logo_url || '',
            cover_image_url: businessDetails.cover_image_url || '',
            services_offered: businessDetails.services_offered || [],
            business_categories: businessCategories,
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
          <p className="text-muted-foreground">
            Manage your personal and business information. Click the edit button on any section to make changes.
          </p>
        </div>
        
        {/* View Profile Button - Only show for providers */}
        {profile?.active_role === 'provider' && (
          <Button
            variant="provider-outline"
            onClick={() => window.open(`/business/${profile.user_id}`, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Public Profile
          </Button>
        )}
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
                  certifications: businessData.certifications,
                  insurance_info: businessData.insurance_info,
                  certification_files: businessData.certification_files,
                  awards_recognitions: businessData.awards_recognitions || '',
                  professional_memberships: businessData.professional_memberships || '',
                  other_qualifications: businessData.other_qualifications || ''
                }}
                userId={profile?.user_id || ''}
                onUpdate={handleBusinessUpdate}
              />
            </div>

            {/* Business Performance - Read-only stats */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="text-xl font-semibold">Business Performance</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{businessData.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{businessData.total_reviews}</div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Profile Status: {businessData.profile_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Enhanced Social Media Section - Read-only display */}
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">Social Media Connections</h3>
              </div>
              
              {businessData.social_media_connections && businessData.social_media_connections.length > 0 ? (
                <div className="space-y-3">
                  {businessData.social_media_connections.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium capitalize">{connection.platform[0]}</span>
                        </div>
                        <div>
                          <p className="font-medium capitalize">{connection.platform}</p>
                          <p className="text-sm text-muted-foreground">@{connection.handle}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Connected</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No social media connections</p>
              )}
            </Card>

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