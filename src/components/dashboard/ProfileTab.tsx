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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          {profile?.active_role === 'provider' ? 'Business Profile' : 'My Profile'}
        </h2>
        <p className="text-muted-foreground">
          {profile?.active_role === 'provider' 
            ? 'Manage your business information and public profile' 
            : 'Manage your personal information and preferences'
          }
        </p>
      </div>

      {/* Personal Information Section */}
      <Card className="card-elegant p-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Personal Information</h3>
            <p className="text-sm text-muted-foreground">Your basic profile details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name *
            </Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              className="h-11 bg-background/50 border-muted focus:border-primary"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone Number *
            </Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter your phone number"
              className="h-11 bg-background/50 border-muted focus:border-primary"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="location" className="text-sm font-medium text-foreground">
              Location *
            </Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter your location"
              className="h-11 bg-background/50 border-muted focus:border-primary"
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="avatar" className="text-sm font-medium text-foreground">
              Profile Picture
            </Label>
            <div className="flex items-center gap-4">
              {profileData.avatar_url ? (
                <div className="relative">
                  <img
                    src={profileData.avatar_url}
                    alt="Profile Picture"
                    className="w-16 h-16 rounded-full object-cover border-2 border-muted"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => setProfileData(prev => ({ ...prev, avatar_url: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
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
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="bio" className="text-sm font-medium text-foreground">
            Bio
          </Label>
          <Textarea
            id="bio"
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us a bit about yourself..."
            rows={4}
            className="bg-background/50 border-muted focus:border-primary resize-none"
          />
          <p className="text-xs text-muted-foreground">
            A brief description about yourself that others will see
          </p>
        </div>
      </Card>

      {/* Business Information Section (Provider only) */}
      {profile?.active_role === 'provider' && (
        <Card className="card-elegant p-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Business Information</h3>
              <p className="text-sm text-muted-foreground">Your business details and contact information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="business_name" className="text-sm font-medium text-foreground">
                Business Name *
              </Label>
              <Input
                id="business_name"
                value={providerDetails.business_name}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter your business name"
                className="h-11 bg-background/50 border-muted focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="business_email" className="text-sm font-medium text-foreground">
                Business Email *
              </Label>
              <Input
                id="business_email"
                type="email"
                value={providerDetails.business_email}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_email: e.target.value }))}
                placeholder="Enter your business email"
                className="h-11 bg-background/50 border-muted focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="business_phone" className="text-sm font-medium text-foreground">
                Business Phone *
              </Label>
              <Input
                id="business_phone"
                value={providerDetails.business_phone}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_phone: e.target.value }))}
                placeholder="Enter your business phone"
                className="h-11 bg-background/50 border-muted focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="business_website" className="text-sm font-medium text-foreground">
                Website
              </Label>
              <Input
                id="business_website"
                value={providerDetails.business_website}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_website: e.target.value }))}
                placeholder="https://your-website.com"
                className="h-11 bg-background/50 border-muted focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="years_experience" className="text-sm font-medium text-foreground">
                Years of Experience
              </Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                max="50"
                value={providerDetails.years_experience}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                className="h-11 bg-background/50 border-muted focus:border-primary"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="business_logo" className="text-sm font-medium text-foreground">
                Business Logo
              </Label>
              <div className="flex items-center gap-4">
                {providerDetails.business_logo_url ? (
                  <div className="relative">
                    <img
                      src={providerDetails.business_logo_url}
                      alt="Business Logo"
                      className="w-16 h-16 rounded-lg object-cover border-2 border-muted"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => setProviderDetails(prev => ({ ...prev, business_logo_url: '' }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <Building className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
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
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="business_description" className="text-sm font-medium text-foreground">
                Business Description
              </Label>
              <Textarea
                id="business_description"
                value={providerDetails.business_description}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_description: e.target.value }))}
                placeholder="Describe your business, services, and what makes you unique..."
                rows={4}
                className="bg-background/50 border-muted focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This description will be visible to potential customers
              </p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="business_address" className="text-sm font-medium text-foreground">
                Business Address
              </Label>
              <Textarea
                id="business_address"
                value={providerDetails.business_address}
                onChange={(e) => setProviderDetails(prev => ({ ...prev, business_address: e.target.value }))}
                placeholder="Enter your business address..."
                rows={3}
                className="bg-background/50 border-muted focus:border-primary resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Your business location for customer reference
              </p>
            </div>
            
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">Social Media Links</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram_url" className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    id="instagram_url"
                    value={providerDetails.instagram_url}
                    onChange={(e) => setProviderDetails(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="@username or full URL"
                    className="h-10 bg-background/50 border-muted focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facebook_url" className="text-xs text-muted-foreground">Facebook</Label>
                  <Input
                    id="facebook_url"
                    value={providerDetails.facebook_url}
                    onChange={(e) => setProviderDetails(prev => ({ ...prev, facebook_url: e.target.value }))}
                    placeholder="Page name or full URL"
                    className="h-10 bg-background/50 border-muted focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tiktok_url" className="text-xs text-muted-foreground">TikTok</Label>
                  <Input
                    id="tiktok_url"
                    value={providerDetails.tiktok_url}
                    onChange={(e) => setProviderDetails(prev => ({ ...prev, tiktok_url: e.target.value }))}
                    placeholder="@username or full URL"
                    className="h-10 bg-background/50 border-muted focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="hero"
          size="lg"
          onClick={handleSaveProfile}
          disabled={saving}
          className="px-8 gap-3"
        >
          <Save className="h-5 w-5" />
          {saving ? 'Saving Changes...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;