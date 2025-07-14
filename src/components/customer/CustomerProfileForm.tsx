import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Camera, Upload, X, Locate, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface CustomerFormData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  profile_photo: File | null;
  privacy_settings: {
    phone_visible: boolean;
    email_visible: boolean;
    location_visible: boolean;
  };
  gdpr_consent: boolean;
  terms_accepted: boolean;
}

interface CustomerProfileFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const CustomerProfileForm: React.FC<CustomerProfileFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    full_name: initialData.full_name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    location: initialData.location || '',
    bio: initialData.bio || '',
    profile_photo: null,
    privacy_settings: {
      phone_visible: initialData.privacy_settings?.phone_visible ?? true,
      email_visible: initialData.privacy_settings?.email_visible ?? false,
      location_visible: initialData.privacy_settings?.location_visible ?? true,
    },
    gdpr_consent: initialData.gdpr_consent ?? false,
    terms_accepted: initialData.terms_accepted ?? false,
  });

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleInputChange = (field: keyof CustomerFormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePrivacyChange = (field: keyof CustomerFormData['privacy_settings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: { ...prev.privacy_settings, [field]: value }
    }));
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (2MB max as per requirements)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be under 2MB",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG or PNG image",
          variant: "destructive"
        });
        return;
      }

      handleInputChange('profile_photo', file);
    }
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive"
      });
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap's Nominatim for reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) throw new Error('Failed to get location');
          
          const data = await response.json();
          
          // Extract city, region, and country for a readable format
          const { city, town, village, county, state, country, postcode } = data.address || {};
          const locationString = [
            city || town || village,
            county || state,
            postcode,
            country
          ].filter(Boolean).join(', ');
          
          handleInputChange('location', locationString || `${latitude}, ${longitude}`);
          
          toast({
            title: "Location detected",
            description: `Set to: ${locationString}`
          });
          
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          toast({
            title: "Location detection failed",
            description: "Could not determine your address",
            variant: "destructive"
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
        
        let message = "Could not access your location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location access denied. Please enable location permissions";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }
        
        toast({
          title: "Location detection failed",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Contact number is required';
    } else {
      // More flexible phone validation to accept various formats:
      // 079, +4479, 79, +44079, etc.
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (!/^(\+?44|0)?[0-9]{8,11}$/.test(cleanPhone) && !/^[0-9]{2,4}[0-9]{6,8}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid phone number (e.g., 079, +4479, 79, +44079)';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required for localized suggestions';
    }

    // Consent validation (only for new profiles, not edits)
    if (!isEdit) {
      if (!formData.gdpr_consent) {
        newErrors.gdpr_consent = 'You must consent to data processing';
      }

      if (!formData.terms_accepted) {
        newErrors.terms_accepted = 'You must accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fix the highlighted errors",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Photo Section */}
        <div className="space-y-3">
          <Label>Profile Picture (Optional)</Label>
          <div className="flex items-center space-x-4">
            {formData.profile_photo ? (
              <div className="relative">
                <img 
                  src={URL.createObjectURL(formData.profile_photo)} 
                  alt="Profile preview" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-muted"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleInputChange('profile_photo', null)}
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <Label 
                htmlFor="profile_photo" 
                className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Photo
              </Label>
              <input
                id="profile_photo"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleProfilePhotoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPEG/PNG only, max 2MB. This helps businesses recognise you.
              </p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <User className="h-5 w-5 mr-2" />
            Personal Information
          </h3>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="full_name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                className={`pl-10 ${errors.full_name ? 'border-destructive' : ''}`}
                required
              />
              {formData.full_name && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                required
              />
              {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) === false && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="e.g., 079, +4479, 79, +44079"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                required
              />
              {formData.phone && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
            <p className="text-xs text-muted-foreground">
              This helps businesses confirm your bookings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location/Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Enter your city, area, or postcode"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className={`pl-10 pr-12 ${errors.location ? 'border-destructive' : ''}`}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-primary/10"
              >
                <Locate className="h-4 w-4" />
              </Button>
              {formData.location && (
                <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
              )}
            </div>
            {errors.location && (
              <p className="text-xs text-destructive">{errors.location}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used to show you nearby businesses and localized recommendations
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">About You (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell businesses a bit about yourself, your preferences, or any special requirements..."
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              This helps businesses provide personalized service
            </p>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Privacy Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose what information businesses can see in your public profile
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="phone_visible"
                checked={formData.privacy_settings.phone_visible}
                onCheckedChange={(checked) => handlePrivacyChange('phone_visible', checked as boolean)}
              />
              <Label htmlFor="phone_visible" className="text-sm">
                Show my contact number to businesses I book with
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="email_visible"
                checked={formData.privacy_settings.email_visible}
                onCheckedChange={(checked) => handlePrivacyChange('email_visible', checked as boolean)}
              />
              <Label htmlFor="email_visible" className="text-sm">
                Show my email address in public profile
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="location_visible"
                checked={formData.privacy_settings.location_visible}
                onCheckedChange={(checked) => handlePrivacyChange('location_visible', checked as boolean)}
              />
              <Label htmlFor="location_visible" className="text-sm">
                Show my general location (city/area) to help businesses find me
              </Label>
            </div>
          </div>
        </div>

        {/* Terms and Consent (only for new profiles) */}
        {!isEdit && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Terms & Privacy</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onCheckedChange={(checked) => handleInputChange('gdpr_consent', checked as boolean)}
                  className={errors.gdpr_consent ? 'border-destructive' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="gdpr_consent" className="text-sm cursor-pointer">
                    I consent to the processing of my personal data in accordance with the Privacy Policy *
                  </Label>
                  {errors.gdpr_consent && (
                    <p className="text-xs text-destructive">{errors.gdpr_consent}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms_accepted"
                  checked={formData.terms_accepted}
                  onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                  className={errors.terms_accepted ? 'border-destructive' : ''}
                />
                <div className="space-y-1">
                  <Label htmlFor="terms_accepted" className="text-sm cursor-pointer">
                    I accept the{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </a>{' '}
                    *
                  </Label>
                  {errors.terms_accepted && (
                    <p className="text-xs text-destructive">{errors.terms_accepted}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {isEdit ? 'Update Profile' : 'Complete Profile'}
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};