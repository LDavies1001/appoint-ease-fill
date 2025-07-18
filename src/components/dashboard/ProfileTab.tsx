import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building, Save, Upload, X } from 'lucide-react';

interface ProfileData {
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
}

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_website: string;
  years_experience: number;
  services_offered: string[];
  operating_hours: string;
  pricing_info: string;
  availability_notes: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  business_logo_url: string;
}

const ProfileTab = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phone: '',
    location: '',
    bio: '',
    avatar_url: ''
  });

  const [providerDetails, setProviderDetails] = useState<ProviderDetails>({
    business_name: '',
    business_description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    business_website: '',
    years_experience: 0,
    services_offered: [],
    operating_hours: '',
    pricing_info: '',
    availability_notes: '',
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    business_logo_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfileData();
    if (profile?.active_role === 'provider') {
      fetchProviderDetails();
    }
  }, [profile]);

  const fetchProfileData = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, phone, location, bio, avatar_url')
        .eq('user_id', profile.user_id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileData({
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProviderDetails({
          business_name: data.business_name || '',
          business_description: data.business_description || '',
          business_email: data.business_email || '',
          business_phone: data.business_phone || '',
          business_address: data.business_address || '',
          business_website: data.business_website || '',
          years_experience: data.years_experience || 0,
          services_offered: data.services_offered || [],
          operating_hours: data.operating_hours || '',
          pricing_info: data.pricing_info || '',
          availability_notes: data.availability_notes || '',
          instagram_url: data.instagram_url || '',
          facebook_url: data.facebook_url || '',
          tiktok_url: data.tiktok_url || '',
          business_logo_url: data.business_logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.user_id}/${fileName}`;
      const bucket = type === 'avatar' ? 'profile-photos' : 'business-photos';

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (type === 'avatar') {
        setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      } else {
        setProviderDetails(prev => ({ ...prev, business_logo_url: publicUrl }));
      }
      
      toast({
        title: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile?.user_id) return;

    setSaving(true);
    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          location: profileData.location,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Update provider details if provider
      if (profile.active_role === 'provider') {
        const { error: providerError } = await supabase
          .from('provider_details')
          .upsert({
            user_id: profile.user_id,
            ...providerDetails
          });

        if (providerError) throw providerError;
      }

      toast({
        title: "Profile updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">
          {profile?.active_role === 'provider' ? 'Business Profile' : 'My Profile'}
        </h2>
        <Button
          variant="hero"
          onClick={handleSaveProfile}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Personal Information */}
      <Card className="card-elegant p-6">
        <div className="flex items-center mb-4">
          <User className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Personal Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter your location"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile Picture</Label>
            <div className="flex items-center gap-2">
              {profileData.avatar_url && (
                <img
                  src={profileData.avatar_url}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                className="hidden"
                id="avatar-upload"
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              {profileData.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileData(prev => ({ ...prev, avatar_url: '' }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>
      </Card>

      {/* Business Information (Provider only) */}
      {profile?.active_role === 'provider' && (
        <Card className="card-elegant p-6">
          <div className="flex items-center mb-4">
            <Building className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">Business Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={providerDetails.business_name}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_email">Business Email</Label>
              <Input
                id="business_email"
                type="email"
                value={providerDetails.business_email}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_email: e.target.value }))}
                placeholder="Enter your business email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_phone">Business Phone</Label>
              <Input
                id="business_phone"
                value={providerDetails.business_phone}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_phone: e.target.value }))}
                placeholder="Enter your business phone"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_website">Website</Label>
              <Input
                id="business_website"
                value={providerDetails.business_website}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_website: e.target.value }))}
                placeholder="Enter your website URL"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={providerDetails.years_experience}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                placeholder="Enter years of experience"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_logo">Business Logo</Label>
              <div className="flex items-center gap-2">
                {providerDetails.business_logo_url && (
                  <img
                    src={providerDetails.business_logo_url}
                    alt="Business Logo"
                    className="w-10 h-10 rounded object-cover"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                  id="logo-upload"
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                {providerDetails.business_logo_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProviderDetails(prev => ({ ...prev, business_logo_url: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                value={providerDetails.business_description}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_description: e.target.value }))}
                placeholder="Describe your business..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="business_address">Business Address</Label>
              <Textarea
                id="business_address"
                value={providerDetails.business_address}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_address: e.target.value }))}
                placeholder="Enter your business address..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={providerDetails.instagram_url}
                  onChange={(e) => setProviderDetails(prev => ({ ...prev, instagram_url: e.target.value }))}
                  placeholder="Instagram profile URL"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="facebook_url">Facebook URL</Label>
                <Input
                  id="facebook_url"
                  value={providerDetails.facebook_url}
                  onChange={(e) => setProviderDetails(prev => ({ ...prev, facebook_url: e.target.value }))}
                  placeholder="Facebook page URL"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tiktok_url">TikTok URL</Label>
                <Input
                  id="tiktok_url"
                  value={providerDetails.tiktok_url}
                  onChange={(e) => setProviderDetails(prev => ({ ...prev, tiktok_url: e.target.value }))}
                  placeholder="TikTok profile URL"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProfileTab;