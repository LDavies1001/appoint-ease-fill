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

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        break;
      case 2:
        if (!formData.location.trim()) newErrors.location = 'Location is required';
        break;
      case 3:
        if (!formData.gdpr_consent) newErrors.gdpr_consent = 'GDPR consent is required';
        if (!formData.terms_accepted) newErrors.terms_accepted = 'Terms acceptance is required';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white mb-4">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Contact Information</h3>
              <p className="text-muted-foreground">Let's start with your basic details</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
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
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Location & Profile</h3>
              <p className="text-muted-foreground">Tell us where you are and about yourself</p>
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
              {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="bio">About You (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="min-h-24"
              />
            </div>

            <div className="space-y-3">
              <Label>Profile Picture (Optional)</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-rose-600 text-white">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <ImageCropUpload
                  onUpload={(url) => setFormData(prev => ({ ...prev, avatar_url: url }))}
                  bucket="profile-images"
                  folder="profiles"
                  aspectRatio={1}
                  title="Upload Profile Picture"
                  description="Upload and crop your profile picture"
                >
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                  </Button>
                </ImageCropUpload>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Privacy & Terms</h3>
              <p className="text-muted-foreground">Configure your privacy settings and accept our terms</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Privacy Settings</h4>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">Make your phone number visible to providers</p>
                  </div>
                </div>
                <Switch
                  checked={formData.privacy_settings.phone_visible}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, phone_visible: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Address</p>
                    <p className="text-sm text-muted-foreground">Make your email visible to providers</p>
                  </div>
                </div>
                <Switch
                  checked={formData.privacy_settings.email_visible}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, email_visible: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">Make your location visible to providers</p>
                  </div>
                </div>
                <Switch
                  checked={formData.privacy_settings.location_visible}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      privacy_settings: { ...prev.privacy_settings, location_visible: checked }
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.gdpr_consent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gdpr_consent: checked as boolean }))}
                />
                <Label className="text-sm">I consent to data processing as outlined in the Privacy Policy (Required)</Label>
              </div>
              {errors.gdpr_consent && <p className="text-sm text-destructive">{errors.gdpr_consent}</p>}

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.terms_accepted}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, terms_accepted: checked as boolean }))}
                />
                <Label className="text-sm">I accept the Terms and Conditions (Required)</Label>
              </div>
              {errors.terms_accepted && <p className="text-sm text-destructive">{errors.terms_accepted}</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Profile Summary</h3>
              <p className="text-muted-foreground">Review your information before completing</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={formData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-rose-500 to-rose-600 text-white">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-lg">{formData.name}</h4>
                  <p className="text-muted-foreground">{formData.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{formData.phone}</p>
                </div>
                <div>
                  <p className="font-medium">Bio</p>
                  <p className="text-muted-foreground">{formData.bio || 'Not provided'}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="font-medium mb-2">Privacy Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <span className={`px-2 py-1 rounded ${formData.privacy_settings.phone_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Phone: {formData.privacy_settings.phone_visible ? 'Visible' : 'Private'}
                  </span>
                  <span className={`px-2 py-1 rounded ${formData.privacy_settings.email_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Email: {formData.privacy_settings.email_visible ? 'Visible' : 'Private'}
                  </span>
                  <span className={`px-2 py-1 rounded ${formData.privacy_settings.location_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    Location: {formData.privacy_settings.location_visible ? 'Visible' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
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
          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              onClick={handleBack}
              disabled={currentStep === 1}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.gdpr_consent || !formData.terms_accepted}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Completing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete Profile</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};