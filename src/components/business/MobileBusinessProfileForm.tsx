import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AddressData } from '@/components/ui/address-form';
import { BusinessDetailsStep } from './mobile-steps/BusinessDetailsStep';
import { ServicesStep } from './mobile-steps/ServicesStep';
import { CredentialsStep } from './mobile-steps/CredentialsStep';
import { SummaryStep } from './mobile-steps/SummaryStep';
import { MobileProgressBar } from './mobile-steps/MobileProgressBar';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  operating_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  certifications: string;
  dbs_checked: boolean;
  certification_files: string[];
}

interface MobileBusinessProfileFormProps {
  mode: 'create' | 'edit';
  existingData?: Partial<BusinessProfileData & {
    services_offered?: string[];
    business_address?: string | AddressData;
  }>;
  onSuccess?: () => void;
}

const STEPS = [
  { title: "Business Info", description: "Name, phone & address" },
  { title: "Services", description: "What you offer" },
  { title: "Credentials", description: "Certifications & socials" },
  { title: "Summary", description: "Hours & description" }
];

const MobileBusinessProfileForm: React.FC<MobileBusinessProfileFormProps> = ({ 
  mode, 
  existingData, 
  onSuccess 
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  // Parse address data helper
  const parseAddressData = (addressData?: string | AddressData): AddressData => {
    if (!addressData) {
      return {
        address_line_1: '',
        address_line_2: '',
        town_city: '',
        postcode: '',
        is_public: false
      };
    }
    
    if (typeof addressData === 'string') {
      return {
        address_line_1: addressData,
        address_line_2: '',
        town_city: '',
        postcode: '',
        is_public: false
      };
    }
    
    return addressData;
  };

  // Initialize form data
  const initializeFormData = () => {
    const savedData = sessionStorage.getItem('businessProfileFormData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }

    if (existingData) {
      return {
        business_name: existingData.business_name || '',
        business_categories: existingData.business_categories || existingData.services_offered || [],
        business_phone: existingData.business_phone || '',
        business_address: parseAddressData(existingData.business_address),
        business_description: existingData.business_description || '',
        business_logo_url: existingData.business_logo_url || '',
        operating_hours: (() => {
          if (existingData.operating_hours) {
            try {
              // If it's a string (from database), parse it
              const parsed = typeof existingData.operating_hours === 'string' 
                ? JSON.parse(existingData.operating_hours)
                : existingData.operating_hours;
              
              // Ensure all days are present with proper structure
              const defaultHours = {
                monday: { open: '09:00', close: '17:00', closed: false },
                tuesday: { open: '09:00', close: '17:00', closed: false },
                wednesday: { open: '09:00', close: '17:00', closed: false },
                thursday: { open: '09:00', close: '17:00', closed: false },
                friday: { open: '09:00', close: '17:00', closed: false },
                saturday: { open: '09:00', close: '17:00', closed: true },
                sunday: { open: '09:00', close: '17:00', closed: true }
              };
              
              // Merge parsed hours with defaults to ensure all days exist
              return { ...defaultHours, ...parsed };
            } catch {
              // If parsing fails, return defaults
              return {
                monday: { open: '09:00', close: '17:00', closed: false },
                tuesday: { open: '09:00', close: '17:00', closed: false },
                wednesday: { open: '09:00', close: '17:00', closed: false },
                thursday: { open: '09:00', close: '17:00', closed: false },
                friday: { open: '09:00', close: '17:00', closed: false },
                saturday: { open: '09:00', close: '17:00', closed: true },
                sunday: { open: '09:00', close: '17:00', closed: true }
              };
            }
          }
          return {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '09:00', close: '17:00', closed: true },
            sunday: { open: '09:00', close: '17:00', closed: true }
          };
        })(),
        certifications: existingData.certifications || '',
        dbs_checked: existingData.dbs_checked || false,
        certification_files: existingData.certification_files || []
      };
    }

    // Default form data
    return {
      business_name: user?.user_metadata?.business_name || profile?.business_name || '',
      business_categories: [],
      business_phone: profile?.phone || user?.user_metadata?.phone || '',
      business_address: parseAddressData(profile?.location || user?.user_metadata?.location),
      business_description: '',
      business_logo_url: '',
      operating_hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '17:00', closed: true },
        sunday: { open: '09:00', close: '17:00', closed: true }
      },
      certifications: '',
      dbs_checked: false,
      certification_files: []
    };
  };

  const [formData, setFormData] = useState<BusinessProfileData>(initializeFormData);
  
  // Debug: Log form data initialization
  console.log('Initial form data:', formData);
  console.log('Initial operating hours:', formData.operating_hours);

  // Fetch categories
  useEffect(() => {
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

    fetchCategories();
  }, []);

  // Save form data to session storage
  useEffect(() => {
    sessionStorage.setItem('businessProfileFormData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (updates: Partial<BusinessProfileData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(formData.business_name && formData.business_phone && formData.business_address.address_line_1);
      case 1:
        return formData.business_categories.length > 0;
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;

    setIsSubmitting(true);
    try {
      // Debug: Log the categories array and what we're trying to save
      console.log('Categories:', categories);
      console.log('formData.business_categories:', formData.business_categories);
      
      // Find the UUID for the business category
      let categoryUuid = null;
      if (formData.business_categories?.length > 0) {
        const firstCategory = formData.business_categories[0];
        // Check if it's already a UUID or if we need to find it by name
        const categoryRecord = categories.find(cat => 
          cat.id === firstCategory || cat.name.toLowerCase() === firstCategory.toLowerCase()
        );
        categoryUuid = categoryRecord?.id || null;
      }

      const profileData = {
        user_id: user.id,
        business_name: formData.business_name,
        business_phone: formData.business_phone,
        formatted_address: `${formData.business_address.address_line_1}${formData.business_address.address_line_2 ? ', ' + formData.business_address.address_line_2 : ''}, ${formData.business_address.town_city}, ${formData.business_address.postcode}`,
        business_postcode: formData.business_address.postcode,
        business_category: categoryUuid,
        business_description: formData.business_description,
        business_logo_url: formData.business_logo_url,
        operating_hours: JSON.stringify(formData.operating_hours),
        certifications: formData.certifications,
        background_check_verified: formData.dbs_checked,
        certification_files: formData.certification_files
      };

      console.log('Saving profile data:', profileData);

      const { error } = mode === 'create' 
        ? await supabase.from('provider_details').insert([profileData])
        : await supabase.from('provider_details').update(profileData).eq('user_id', user.id);

      if (error) throw error;

      // Mark profile as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_profile_complete: true })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile completion:', profileError);
        throw profileError;
      }

      // Clear session storage
      sessionStorage.removeItem('businessProfileFormData');

      toast({
        title: "Success!",
        description: mode === 'create' ? "Business profile created successfully!" : "Profile updated successfully!"
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save profile. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BusinessDetailsStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 1:
        return (
          <ServicesStep
            formData={formData}
            onUpdate={updateFormData}
            categories={categories}
          />
        );
      case 2:
        return (
          <CredentialsStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <SummaryStep
            formData={formData}
            onUpdate={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;
  const canProceed = validateStep(currentStep);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">
              {mode === 'create' ? 'Create Profile' : 'Edit Profile'}
            </h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          <MobileProgressBar 
            currentStep={currentStep} 
            totalSteps={STEPS.length}
            stepTitle={STEPS[currentStep].title}
            stepDescription={STEPS[currentStep].description}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 pb-24">
        {renderCurrentStep()}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {isLastStep ? (
            <Button
              variant="business"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Saving...' : 'Complete'}
            </Button>
          ) : (
            <Button
              variant="business"
              onClick={handleNext}
              disabled={!canProceed}
              className="flex-1"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileBusinessProfileForm;