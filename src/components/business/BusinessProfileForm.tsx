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
import { AddressForm, AddressData } from '@/components/ui/address-form';
import { SocialMediaConnector } from './SocialMediaConnector';
import { 
  Building, 
  Phone, 
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Sparkles
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
  business_address: AddressData;
  business_description: string;
  business_logo_url: string;
}

interface BusinessProfileFormProps {
  mode: 'create' | 'edit';
  existingData?: Partial<BusinessProfileData & {
    services_offered?: string[];
    business_address?: string | AddressData; // Support both legacy string and new structured address
  }>;
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
    title: "Connect Socials",
    description: "Social media links"
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
  
  // Helper function to parse address data
  const parseAddressData = (addressData?: string | AddressData): AddressData => {
    if (!addressData) {
      return {
        address_line_1: '',
        address_line_2: '',
        town_city: '',
        postcode: '',
        is_public: false // Default to private for safety
      };
    }
    
    if (typeof addressData === 'string') {
      // Legacy format - try to parse or return as address_line_1
      return {
        address_line_1: addressData,
        address_line_2: '',
        town_city: '',
        postcode: '',
        is_public: false // Default to private for safety
      };
    }
    
    // Already structured address data
    return {
      address_line_1: addressData.address_line_1 || '',
      address_line_2: addressData.address_line_2 || '',
      town_city: addressData.town_city || '',
      postcode: addressData.postcode || '',
      is_public: addressData.is_public ?? false // Default to private for safety
    };
  };

  const [formData, setFormData] = useState<BusinessProfileData>({
    business_name: existingData?.business_name || '',
    business_categories: existingData?.business_categories || existingData?.services_offered || [],
    business_phone: existingData?.business_phone || '',
    business_address: parseAddressData(existingData?.business_address),
    business_description: existingData?.business_description || '',
    business_logo_url: existingData?.business_logo_url || ''
  });

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    if (existingData) {
      setFormData(prev => ({
        ...prev,
        business_name: existingData.business_name || '',
        business_categories: existingData.business_categories || existingData.services_offered || [],
        business_phone: existingData.business_phone || '',
        business_address: parseAddressData(existingData.business_address),
        business_description: existingData.business_description || '',
        business_logo_url: existingData.business_logo_url || ''
      }));
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.business_name.trim()) {
        newErrors.business_name = 'Business name is required';
      }
      if (!formData.business_phone.trim()) {
        newErrors.business_phone = 'Phone number is required';
      }
      
      // Validate address fields - Street name is required when not using address selector
      const address = formData.business_address;
      if (!address.address_line_2.trim()) {
        newErrors.address_line_2 = 'Street name is required';
      }
      if (!address.town_city.trim()) {
        newErrors.town_city = 'Town/City is required';
      }
      if (!address.postcode.trim()) {
        newErrors.postcode = 'Postcode is required';
      } else {
        // Validate UK postcode format (assuming UK since we removed country field)
        const ukPostcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;
        if (!ukPostcodeRegex.test(address.postcode.replace(/\s/g, ''))) {
          newErrors.postcode = 'Please enter a valid UK postcode';
        }
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

  const handleInputChange = (field: keyof BusinessProfileData, value: string | string[] | AddressData) => {
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
      if (currentStep < 4) {
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
      // Convert structured address to string for database storage
      const addressString = [
        formData.business_address.address_line_1,
        formData.business_address.address_line_2,
        formData.business_address.town_city,
        formData.business_address.postcode
      ].filter(Boolean).join(', ');

      const submitData = {
        business_name: formData.business_name,
        business_category: formData.business_categories[0] || null, // Primary category
        services_offered: formData.business_categories,
        business_phone: formData.business_phone,
        business_address: addressString,
        is_address_public: formData.business_address.is_public, // Store privacy setting
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
          <div className="space-y-8 animate-fade-in">
            {/* Business Logo Section */}
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-accent">Let's start with your logo</h3>
                <p className="text-muted-foreground text-lg">
                  A great logo helps customers remember and trust your business
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-glow rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-300 blur"></div>
                  <Avatar className="relative h-36 w-36 border-4 border-white shadow-xl">
                    <AvatarImage src={formData.business_logo_url} className="object-cover" />
                    <AvatarFallback className="text-5xl bg-gradient-to-br from-accent to-accent-glow text-white font-bold">
                      {formData.business_name.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-3 -right-3">
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
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-accent to-accent-glow hover:from-accent/90 hover:to-accent-glow/90 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {uploadingLogo ? (
                          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  Upload a logo (JPEG/PNG, max 2MB) - Optional but highly recommended for professional appeal
                </p>
              </div>
            </div>

            {/* Business Details Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Business Name */}
              <div className="space-y-3">
                <Label htmlFor="business_name" className="text-base font-semibold text-accent flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Business Name <span className="text-destructive ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="Enter your business name"
                    className={`h-12 pl-4 pr-12 text-lg border-2 transition-all duration-300 focus:border-accent focus:ring-accent/20 focus:ring-4 ${errors.business_name ? 'border-destructive' : 'border-accent/30'}`}
                  />
                  {formData.business_name && !errors.business_name && (
                    <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                  )}
                </div>
                {errors.business_name && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_name}
                  </p>
                )}
              </div>

              {/* Business Phone */}
              <div className="space-y-3">
                <Label htmlFor="business_phone" className="text-base font-semibold text-accent flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Business Phone <span className="text-destructive ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="business_phone"
                    value={formData.business_phone}
                    onChange={(e) => handleInputChange('business_phone', e.target.value)}
                    placeholder="+44 123 456 7890"
                    className={`h-12 pl-4 pr-12 text-lg border-2 transition-all duration-300 focus:border-accent focus:ring-accent/20 focus:ring-4 ${errors.business_phone ? 'border-destructive' : 'border-accent/30'}`}
                  />
                  {formData.business_phone && !errors.business_phone && (
                    <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent" />
                  )}
                </div>
                {errors.business_phone && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Business Address */}
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 border border-accent/20">
              <h4 className="text-lg font-semibold text-accent mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Business Address
              </h4>
              <AddressForm
                value={formData.business_address}
                onChange={(address) => handleInputChange('business_address', address)}
                errors={{
                  address_line_1: errors.address_line_1,
                  town_city: errors.town_city,
                  postcode: errors.postcode
                }}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent-glow rounded-full mb-4 shadow-lg">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-accent">What services do you provide?</h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                This helps customers find exactly what they're looking for. Choose up to 3 services that best represent your business.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 border border-accent/20">
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
            </div>
            
            {errors.business_categories && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm text-destructive flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.business_categories}
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <SocialMediaConnector />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent-glow rounded-full mb-4 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-accent">Tell us about your business</h3>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Share what makes your business special and help customers understand why they should choose you.
              </p>
            </div>

            <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 border border-accent/20">
              <Label htmlFor="business_description" className="text-base font-semibold text-accent mb-4 block">
                Business Description (Optional)
              </Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                placeholder="Describe your business, services, experience, or what makes you unique..."
                className="min-h-[140px] text-base border-2 border-accent/30 focus:border-accent focus:ring-accent/20 focus:ring-4 transition-all duration-300"
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-muted-foreground">
                  Help customers understand what makes your business special
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {formData.business_description.length}/300
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent to-accent-glow rounded-xl p-6 text-white text-center">
              <h4 className="font-bold text-xl mb-2">🎉 Almost done!</h4>
              <p className="text-white/90 text-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/10 py-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJoc2woMTIwIDMwJSA3NSUgLyAwLjEpIi8+Cjwvc3ZnPg==')] opacity-50"></div>
      
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent-glow rounded-full mb-6 shadow-lg">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent mb-4">
            Complete Your Profile
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Set up your professional presence to attract customers and grow your business
          </p>
        </div>

        {/* Enhanced Stepper */}
        <div className="mb-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <Stepper currentStep={currentStep} steps={STEPS} />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-white/30 relative overflow-hidden">
          {/* Card background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/10 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            {renderStepContent()}

            {/* Enhanced Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-8 border-t border-accent/20">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="w-full sm:w-auto min-w-[140px] h-12 border-2 border-accent/30 hover:border-accent hover:bg-accent/10 hover:text-accent transition-all duration-300 group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                Back
              </Button>

              <div className="flex items-center text-sm text-muted-foreground">
                Step {currentStep} of {STEPS.length}
              </div>

              <Button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full sm:w-auto min-w-[200px] h-12 bg-gradient-to-r from-accent to-accent-glow hover:from-accent/90 hover:to-accent-glow/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Create My Business Profile
                  </>
                ) : (
                  <>
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer encouragement */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Join thousands of professionals growing their business with us
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfileForm;