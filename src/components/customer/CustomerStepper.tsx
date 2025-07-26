import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Phone, MapPin, Camera, Upload, X, Locate, CheckCircle, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';

interface CustomerStepData {
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

interface CustomerStepperProps {
  initialData?: Partial<CustomerStepData>;
  onComplete: (data: CustomerStepData) => Promise<void>;
  isLoading?: boolean;
  userFullName: string;
  userEmail: string;
}

export const CustomerStepper: React.FC<CustomerStepperProps> = ({
  initialData = {},
  onComplete,
  isLoading = false,
  userFullName,
  userEmail
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [formData, setFormData] = useState<CustomerStepData>({
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

  const { toast } = useToast();

  const steps = [
    { title: "Contact & Location", description: "Your basic contact information" },
    { title: "Profile & Privacy", description: "Profile picture and privacy settings" },
    { title: "Terms & Complete", description: "Accept terms and finish setup" },
  ];

  const handleInputChange = (field: keyof CustomerStepData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: keyof CustomerStepData['privacy_settings'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: { ...prev.privacy_settings, [field]: value }
    }));
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be under 2MB",
          variant: "destructive"
        });
        return;
      }

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
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) throw new Error('Failed to get location');
          
          const data = await response.json();
          
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
        }
        
        toast({
          title: "Location detection failed",
          description: message,
          variant: "destructive"
        });
      }
    );
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Contact & Location
        if (!formData.phone.trim()) {
          toast({
            title: "Phone number required",
            description: "Please enter your contact number",
            variant: "destructive"
          });
          return false;
        }
        if (!formData.location.trim()) {
          toast({
            title: "Location required",
            description: "Please enter your location for localized suggestions",
            variant: "destructive"
          });
          return false;
        }
        return true;
      case 2: // Terms & Complete
        if (!formData.gdpr_consent || !formData.terms_accepted) {
          toast({
            title: "Consent required",
            description: "Please accept the terms and privacy policy to continue",
            variant: "destructive"
          });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep === steps.length - 1) {
        onComplete(formData);
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Contact & Location
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Hi {userFullName}!</h2>
              <p className="text-muted-foreground">Let's get your contact details and location</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    required
                  />
                  {formData.phone && (
                    <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                </div>
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
                    className="pl-10 pr-12"
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
                <p className="text-xs text-muted-foreground">
                  Click the location icon to auto-detect your current location
                </p>
              </div>
            </div>
          </div>
        );

      case 1: // Profile & Privacy
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Profile & Privacy</h2>
              <p className="text-muted-foreground">Add a photo and set your privacy preferences</p>
            </div>
            
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Picture (Optional)</h3>
                <div className="flex flex-col items-center space-y-4">
                  {formData.profile_photo ? (
                    <div className="relative">
                      <img 
                        src={URL.createObjectURL(formData.profile_photo)} 
                        alt="Profile preview" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-muted"
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
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-muted-foreground/50">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  <Label 
                    htmlFor="profile_photo" 
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.profile_photo ? 'Change Photo' : 'Add Photo'}
                  </Label>
                  <input
                    id="profile_photo"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <Label htmlFor="bio">About You (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell businesses about your preferences or special requirements..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Privacy Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="phone_visible"
                      checked={formData.privacy_settings.phone_visible}
                      onCheckedChange={(checked) => handlePrivacyChange('phone_visible', checked as boolean)}
                    />
                    <Label htmlFor="phone_visible" className="text-sm">
                      Show my contact number to businesses I book with
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="location_visible"
                      checked={formData.privacy_settings.location_visible}
                      onCheckedChange={(checked) => handlePrivacyChange('location_visible', checked as boolean)}
                    />
                    <Label htmlFor="location_visible" className="text-sm">
                      Show my general location to help businesses find me
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Terms & Complete
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Terms & Privacy</h2>
              <p className="text-muted-foreground">Please review and accept to complete your profile</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="gdpr_consent"
                  checked={formData.gdpr_consent}
                  onCheckedChange={(checked) => handleInputChange('gdpr_consent', checked as boolean)}
                />
                <Label htmlFor="gdpr_consent" className="text-sm cursor-pointer">
                  I consent to the processing of my personal data in accordance with the{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    Privacy Policy
                  </a>{' '}
                  *
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms_accepted"
                  checked={formData.terms_accepted}
                  onCheckedChange={(checked) => handleInputChange('terms_accepted', checked as boolean)}
                />
                <Label htmlFor="terms_accepted" className="text-sm cursor-pointer">
                  I accept the{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms and Conditions
                  </a>{' '}
                  *
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-primary font-medium">{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300 animate-scale-in"
            style={{ 
              background: 'var(--gradient-primary)', 
              width: `${((currentStep + 1) / steps.length) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center space-x-4 mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
              ${index <= currentStep 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted text-muted-foreground'
              }
            `}>
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`
                w-12 h-0.5 mx-2 transition-all duration-300
                ${index < currentStep ? 'bg-primary' : 'bg-muted'}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8 border-l-4 border-l-primary">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary mb-1">
            {steps[currentStep].title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {steps[currentStep].description}
          </p>
        </div>

        {renderStepContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            className={`border-primary/20 text-primary hover:bg-primary/5 ${currentStep === 0 ? 'invisible' : ''}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Profile
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};