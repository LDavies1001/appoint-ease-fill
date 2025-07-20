import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Stepper } from '@/components/ui/stepper';
import { CategorySelector } from '@/components/ui/category-selector';
import { 
  Building, 
  MapPin, 
  Phone, 
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Locate
} from 'lucide-react';

interface BusinessCategory {
  id: string;
  name: string;
  category_type: string;
  description: string;
}

interface BusinessProfileData {
  business_name: string;
  business_categories: string[];
  business_phone: string;
  business_address: string;
  business_description: string;
  business_logo_url: string;
}

interface BusinessProfileFormProps {
  mode: 'create' | 'edit';
  existingData?: Partial<BusinessProfileData>;
  onSuccess?: () => void;
}

const STEPS = [
  {
    title: "Business Details",
    description: "Basic information"
  },
  {
    title: "Services Offered", 
    description: "What you provide"
  },
  {
    title: "Business Summary",
    description: "Optional details"
  }
];

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ 
  mode, 
  existingData, 
  onSuccess 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BusinessProfileData>({
    business_name: '',
    business_categories: [],
    business_phone: '',
    business_address: '',
    business_description: '',
    business_logo_url: '',
    ...existingData
  });

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    if (existingData) {
      setFormData(prev => ({ ...prev, ...existingData }));
    }
  }, [existingData]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
          
          const { road, house_number, city, town, village, county, state, postcode, country } = data.address || {};
          const locationString = [
            house_number && road ? `${house_number} ${road}` : road,
            city || town || village,
            county || state,
            postcode,
            country
          ].filter(Boolean).join(', ');
          
          setFormData(prev => ({ ...prev, business_address: locationString || `${latitude}, ${longitude}` }));
          
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.business_name.trim()) {
        newErrors.business_name = 'Business name is required';
      }
      if (!formData.business_phone.trim()) {
        newErrors.business_phone = 'Phone number is required';
      }
      if (!formData.business_address.trim()) {
        newErrors.business_address = 'Business address is required';
      }
    }

    if (currentStep === 2) {
      if (formData.business_categories.length === 0) {
        newErrors.business_categories = 'Please select at least one service category';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BusinessProfileData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG or PNG image",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('business-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, business_logo_url: data.publicUrl }));
      
      toast({
        title: "Logo uploaded successfully",
        description: "Your business logo has been uploaded"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const submitData = {
        business_name: formData.business_name,
        business_category: formData.business_categories[0] || null, // Primary category
        services_offered: formData.business_categories,
        business_phone: formData.business_phone,
        business_address: formData.business_address,
        business_description: formData.business_description,
        business_logo_url: formData.business_logo_url,
        user_id: user?.id,
        profile_published: true
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('provider_details')
          .insert(submitData);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('provider_details')
          .update(submitData)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      }

      // Mark profile as complete
      await supabase
        .from('profiles')
        .update({ is_profile_complete: true })
        .eq('user_id', user?.id);

      toast({
        title: "Profile created successfully!",
        description: "Your business profile is now live and visible to customers"
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/business-profile');
      }
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
          <div className="space-y-6 animate-fade-in">
            {/* Business Logo */}
            <div className="text-center space-y-4">
              <Label className="text-lg font-semibold text-accent">Upload your business logo</Label>
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-accent/30">
                    <AvatarImage src={formData.business_logo_url} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-accent to-accent/80 text-white">
                      {formData.business_name.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingLogo}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploadingLogo}
                        className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90"
                      >
                        {uploadingLogo ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a logo (JPEG/PNG, max 2MB) - Optional but recommended
              </p>
            </div>

            {/* Business Name */}
            <div>
              <Label htmlFor="business_name" className="text-sm font-semibold text-accent">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-2">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Enter your business name"
                  className={`pl-10 transition-all duration-200 focus:border-accent focus:ring-accent ${errors.business_name ? 'border-destructive' : ''}`}
                />
                {formData.business_name && !errors.business_name && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
                )}
              </div>
              {errors.business_name && (
                <p className="text-sm text-destructive mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.business_name}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="business_phone" className="text-sm font-semibold text-accent">
                Contact Number <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-2">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  placeholder="+44 123 456 7890"
                  className={`pl-10 transition-all duration-200 focus:border-accent focus:ring-accent ${errors.business_phone ? 'border-destructive' : ''}`}
                />
                {formData.business_phone && !errors.business_phone && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-accent" />
                )}
              </div>
              {errors.business_phone && (
                <p className="text-sm text-destructive mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.business_phone}
                </p>
              )}
            </div>

            {/* Business Address */}
            <div>
              <Label htmlFor="business_address" className="text-sm font-semibold text-accent">
                Business Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-2">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-accent" />
                <Textarea
                  id="business_address"
                  value={formData.business_address}
                  onChange={(e) => handleInputChange('business_address', e.target.value)}
                  placeholder="Enter your full business address"
                  className={`min-h-[80px] pl-10 pr-12 transition-all duration-200 focus:border-accent focus:ring-accent ${errors.business_address ? 'border-destructive' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-accent/10"
                  title="Detect current location"
                >
                  <Locate className={`h-4 w-4 ${detectingLocation ? 'animate-spin' : ''}`} />
                </Button>
                {formData.business_address && !errors.business_address && (
                  <CheckCircle className="absolute right-12 top-3 h-4 w-4 text-accent" />
                )}
              </div>
              {errors.business_address && (
                <p className="text-sm text-destructive mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.business_address}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-accent">What services do you provide?</h3>
              <p className="text-muted-foreground">
                This helps customers find exactly what they're looking for.
              </p>
            </div>
            
            <CategorySelector
              categories={categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                description: cat.description
              }))}
              selectedCategories={formData.business_categories}
              onSelectionChange={(selected) => handleInputChange('business_categories', selected)}
              maxSelections={3}
            />
            
            {errors.business_categories && (
              <p className="text-sm text-destructive flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.business_categories}
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-accent">Tell us about your business</h3>
              <p className="text-muted-foreground">
                Share what makes your business special (optional).
              </p>
            </div>

            <div>
              <Label htmlFor="business_description" className="text-sm font-semibold text-accent">
                Business Description (Optional)
              </Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                placeholder="Describe your business, services, experience, or what makes you unique..."
                className="min-h-[120px] mt-2 transition-all duration-200 focus:border-accent focus:ring-accent"
                maxLength={300}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.business_description.length}/300 characters
              </p>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-lg p-6">
              <h4 className="font-semibold text-accent mb-2">Almost done! 🎉</h4>
              <p className="text-sm text-muted-foreground">
                Your business profile will be published and visible to customers once you complete this step.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-accent/5 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-accent mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xl text-muted-foreground">
            Set up your professional presence to attract customers
          </p>
        </div>

        <div className="mb-8">
          <Stepper currentStep={currentStep} steps={STEPS} />
        </div>

        <Card className="p-8 shadow-lg border-accent/20">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-accent/20">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="border-accent hover:bg-accent hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="bg-accent hover:bg-accent/90 text-white transition-all duration-200"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : currentStep === 3 ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {currentStep === 3 ? 'Create My Free Business Account' : 'Next'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BusinessProfileForm;