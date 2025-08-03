import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Stepper } from '@/components/ui/stepper';
import { PostcodeLookup } from '@/components/ui/postcode-lookup-enhanced';
import { ImageCropUpload } from '@/components/ui/image-crop-upload';
import { 
  User, 
  Phone, 
  MapPin,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Shield,
  Heart,
  Mail
} from 'lucide-react';

interface PrivacySettings {
  phone_visible: boolean;
  email_visible: boolean;
  location_visible: boolean;
}

interface CustomerProfileData {
  name: string;
  phone: string;
  location: string;
  bio: string;
  avatar_url: string;
  privacy_settings: PrivacySettings;
  gdpr_consent: boolean;
  terms_accepted: boolean;
}

interface CustomerProfileFormProps {
  mode: 'create' | 'edit';
  existingData?: Partial<CustomerProfileData>;
  onSuccess?: () => void;
}

const STEPS = [
  { title: "Contact Information", description: "Your personal details" },
  { title: "Location & Profile", description: "Where you are & about you" },
  { title: "Privacy & Terms", description: "Settings & agreements" },
  { title: "Profile Summary", description: "Review & complete" }
];

export const CustomerProfileForm: React.FC<CustomerProfileFormProps> = ({ 
  mode, 
  existingData, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<CustomerProfileData>({
    name: existingData?.name || '',
    phone: existingData?.phone || '',
    location: existingData?.location || '',
    bio: existingData?.bio || '',
    avatar_url: existingData?.avatar_url || '',
    privacy_settings: existingData?.privacy_settings || {
      phone_visible: true,
      email_visible: false,
      location_visible: true
    },
    gdpr_consent: existingData?.gdpr_consent || false,
    terms_accepted: existingData?.terms_accepted || false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          privacy_settings: formData.privacy_settings as any,
          gdpr_consent: formData.gdpr_consent,
          terms_accepted: formData.terms_accepted,
          is_profile_complete: true
        })
        .eq('user_id', user?.id);
      
      if (error) throw error;

      // Refresh the profile in AuthContext to update local state
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        privacy_settings: formData.privacy_settings,
        gdpr_consent: formData.gdpr_consent,
        terms_accepted: formData.terms_accepted,
        is_profile_complete: true
      });

      toast({
        title: "Profile completed successfully!",
        description: "Welcome to OpenSlot!"
      });

      if (onSuccess) onSuccess();
      else navigate('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Complete Your Profile
        </h1>
        <p className="text-muted-foreground">Step 2 of 2: Tell us about yourself</p>
      </div>

      <Stepper steps={STEPS} currentStep={currentStep} />

      <Card className="bg-white/60 backdrop-blur-sm shadow-elegant rounded-2xl border border-rose-100/50 mt-8">
        <div className="p-8 lg:p-12">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter your location"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="bio">About You (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.gdpr_consent}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gdpr_consent: checked as boolean }))}
              />
              <Label>I consent to data processing (Required)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={formData.terms_accepted}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
              />
              <Label>I accept the Terms and Conditions (Required)</Label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.gdpr_consent || !formData.terms_accepted}
            className="w-full mt-8 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white"
          >
            {loading ? 'Completing...' : 'Complete Profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
};