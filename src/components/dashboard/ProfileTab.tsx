// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Building, Shield, Clock, MapPin, Star, Award, Camera, ExternalLink, BarChart3, Share2 } from 'lucide-react';

import { PersonalInfoSection } from '@/components/business/PersonalInfoSection';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';
import { BusinessLocationSection } from '@/components/business/BusinessLocationSection';
import { OperatingHoursSection } from '@/components/business/OperatingHoursSection';
import { BusinessBrandingSection } from '@/components/business/BusinessBrandingSection';
import { AddressSection } from '@/components/business/AddressSection';
import { CertificationsSection } from '@/components/business/CertificationsSection';
import { CustomerPortfolio } from '@/components/profile/CustomerPortfolio';

interface PersonalData {
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
  privacy_settings: any;
  notification_preferences: any;
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
  business_postcode: string;
  formatted_address: string;
  latitude: number | null;
  longitude: number | null;
  service_radius_miles: number;
  coverage_areas: any[];
  is_address_public: boolean;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  years_experience: number;
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
    avatar_url: '',
    privacy_settings: {},
    notification_preferences: {}
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
    business_postcode: '',
    formatted_address: '',
    latitude: null,
    longitude: null,
    service_radius_miles: 5,
    coverage_areas: [],
    is_address_public: false,
    facebook_url: '',
    instagram_url: '',
    tiktok_url: '',
    years_experience: 0,
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
        .select('name, phone, location, bio, avatar_url, privacy_settings, notification_preferences')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData) {
        setPersonalData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          location: profileData.location || '',
          bio: profileData.bio || '',
          avatar_url: profileData.avatar_url || '',
          privacy_settings: profileData.privacy_settings || {},
          notification_preferences: profileData.notification_preferences || {}
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
            business_postcode: businessDetails.business_postcode || '',
            formatted_address: businessDetails.formatted_address || '',
            latitude: businessDetails.latitude || null,
            longitude: businessDetails.longitude || null,
            service_radius_miles: businessDetails.service_radius_miles || 5,
            coverage_areas: Array.isArray(businessDetails.coverage_areas) ? businessDetails.coverage_areas : [],
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

  const updatePrivacySetting = async (setting: string, value: boolean) => {
    try {
      const updatedSettings = {
        ...personalData.privacy_settings,
        [setting]: value
      };

      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: updatedSettings })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      setPersonalData(prev => ({
        ...prev,
        privacy_settings: updatedSettings
      }));

      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved."
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings",
        variant: "destructive"
      });
    }
  };

  const updateNotificationSetting = async (setting: string, value: boolean) => {
    try {
      const updatedPreferences = {
        ...personalData.notification_preferences,
        [setting]: value
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: updatedPreferences })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      setPersonalData(prev => ({
        ...prev,
        notification_preferences: updatedPreferences
      }));

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive"
      });
    }
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
      {profile?.active_role === 'customer' ? (
        <>
          {/* Customer Profile Header */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              My Profile Settings
            </h2>
            <p className="text-muted-foreground">
              Update your personal information and preferences
            </p>
          </div>

          {/* Personal Information */}
          <PersonalInfoSection 
            data={personalData} 
            userId={profile.user_id}
            onUpdate={handlePersonalUpdate}
          />

          {/* Privacy & Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Communication Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Privacy Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Privacy Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Email Visibility</label>
                      <p className="text-xs text-muted-foreground">Allow businesses to see your email for marketing</p>
                    </div>
                    <Switch 
                      checked={personalData.privacy_settings?.email_visible || false}
                      onCheckedChange={(checked) => updatePrivacySetting('email_visible', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Phone Visibility</label>
                      <p className="text-xs text-muted-foreground">Allow businesses to see your phone number</p>
                    </div>
                    <Switch 
                      checked={personalData.privacy_settings?.phone_visible || false}
                      onCheckedChange={(checked) => updatePrivacySetting('phone_visible', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Location Visibility</label>
                      <p className="text-xs text-muted-foreground">Allow businesses to see your general location</p>
                    </div>
                    <Switch 
                      checked={personalData.privacy_settings?.location_visible || false}
                      onCheckedChange={(checked) => updatePrivacySetting('location_visible', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notification Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold text-foreground">Notification Preferences</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-xs text-muted-foreground">Receive booking confirmations and updates via email</p>
                    </div>
                    <Switch 
                      checked={personalData.notification_preferences?.email_notifications || false}
                      onCheckedChange={(checked) => updateNotificationSetting('email_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">SMS Notifications</label>
                      <p className="text-xs text-muted-foreground">Receive booking reminders via SMS</p>
                    </div>
                    <Switch 
                      checked={personalData.notification_preferences?.sms_notifications || false}
                      onCheckedChange={(checked) => updateNotificationSetting('sms_notifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Marketing Communications</label>
                      <p className="text-xs text-muted-foreground">Receive special offers and promotions from businesses</p>
                    </div>
                    <Switch 
                      checked={personalData.notification_preferences?.marketing_communications || false}
                      onCheckedChange={(checked) => updateNotificationSetting('marketing_communications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Booking Reminders</label>
                      <p className="text-xs text-muted-foreground">Get reminders before your appointments</p>
                    </div>
                    <Switch 
                      checked={personalData.notification_preferences?.booking_reminders || false}
                      onCheckedChange={(checked) => updateNotificationSetting('booking_reminders', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Service Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Preferred Service Categories</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select your interests to get personalized recommendations
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Lash Extensions', 'Nail Care', 'Hair Styling', 'Skincare', 'Massage', 'Makeup'].map((category) => (
                    <Badge 
                      key={category}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="budget-range" className="text-sm font-medium">
                  Preferred Budget Range
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Help us show you services within your budget
                </p>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-25">£0 - £25</SelectItem>
                    <SelectItem value="25-50">£25 - £50</SelectItem>
                    <SelectItem value="50-100">£50 - £100</SelectItem>
                    <SelectItem value="100-200">£100 - £200</SelectItem>
                    <SelectItem value="200+">£200+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer Portfolio */}
          <CustomerPortfolio customerId={profile.user_id} isOwner={true} />
        </>
      ) : (
        // Provider content (existing code)
        <>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
              <p className="text-muted-foreground">
                Manage your personal and business information. Click the edit button on any section to make changes.
              </p>
            </div>
            
            {/* View Profile Button - Only show for providers */}
            <Button
              variant="provider-outline"
              onClick={() => window.open(`/business/${profile.user_id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Public Profile
            </Button>
          </div>

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
                coverage_areas: businessData.coverage_areas
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
                  business_postcode: businessData.business_postcode,
                  formatted_address: businessData.formatted_address,
                  latitude: businessData.latitude,
                  longitude: businessData.longitude,
                  service_radius_miles: businessData.service_radius_miles,
                  coverage_areas: businessData.coverage_areas,
                  is_address_public: businessData.is_address_public
                }}
                userId={profile?.user_id || ''}
                onUpdate={handleBusinessUpdate}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileTab;