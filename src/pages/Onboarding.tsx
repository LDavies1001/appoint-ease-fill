import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Building, MapPin, Phone, FileText, CheckCircle, Clock, DollarSign, Mail, Globe, Star, Locate, Upload, X, Camera, ArrowRight, Copy } from 'lucide-react';
import Header from '@/components/ui/header';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';
import { CustomerStepper } from '@/components/customer/CustomerStepper';
import { LocationInput } from '@/components/ui/location-input';

interface Service {
  id: string;
  name: string;
  category: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    phone: '',
    location: '',
    bio: '',
    profile_photo: null as File | null,
    // Business Information
    business_name: '',
    business_description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    services_offered: [] as string[],
    business_photos: [] as File[],
    // Business Details
    business_website: '',
    years_experience: '',
    pricing_info: [] as { service: string; price: string }[],
    operating_hours: [
      { day: 'Monday', open: '09:00', close: '17:00', closed: false },
      { day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
      { day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
      { day: 'Thursday', open: '09:00', close: '17:00', closed: false },
      { day: 'Friday', open: '09:00', close: '17:00', closed: false },
      { day: 'Saturday', open: '09:00', close: '17:00', closed: true },
      { day: 'Sunday', open: '09:00', close: '17:00', closed: true }
    ],
    // Additional Business Info
    certifications: '',
    is_private_address: false,
    upload_photos_later: false
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    // If profile is complete, redirect to dashboard
    if (profile.is_profile_complete) {
      navigate('/dashboard');
      return;
    }

    // DEBUG: Log profile information
    console.log('Profile data:', profile);
    console.log('User role:', profile.role);
    console.log('Current step:', currentStep);
    console.log('Phone from profile:', profile.phone);
    console.log('Location from profile:', profile.location);

    // Pre-fill form with existing data from profile
    setFormData(prev => ({
      ...prev,
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || '',
      // Auto-populate business name from user metadata if it exists
      business_name: prev.business_name || (user?.user_metadata?.business_name) || ''
    }));

    // Fetch existing provider details if user is a provider
    if (profile.role === 'provider') {
      fetchProviderDetails();
    }

    // Fetch services
    fetchServices();
  }, [user, profile, navigate, currentStep]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSameAsPersonalPhone = () => {
    setFormData(prev => ({ ...prev, business_phone: prev.phone }));
  };

  const fetchProviderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Pre-populate form with existing provider details
        setFormData(prev => ({
          ...prev,
          business_name: data.business_name || '',
          business_email: data.business_email || '',
          business_phone: data.business_phone || '',
          business_address: data.business_address || '',
          business_description: data.business_description || '',
          services_offered: data.services_offered || [],
          business_website: data.business_website || '',
          years_experience: data.years_experience?.toString() || '',
          pricing_info: data.pricing_info ? JSON.parse(data.pricing_info) : [],
          operating_hours: data.operating_hours ? JSON.parse(data.operating_hours) : prev.operating_hours,
          certifications: data.certifications || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(serviceId)
        ? prev.services_offered.filter(id => id !== serviceId)
        : [...prev.services_offered, serviceId]
    }));
  };

  const handleOperatingHoursChange = (dayIndex: number, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: prev.operating_hours.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const addPriceItem = () => {
    setFormData(prev => ({
      ...prev,
      pricing_info: [...prev.pricing_info, { service: '', price: '' }]
    }));
  };

  const removePriceItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pricing_info: prev.pricing_info.filter((_, i) => i !== index)
    }));
  };

  const updatePriceItem = (index: number, field: 'service' | 'price', value: string) => {
    setFormData(prev => ({
      ...prev,
      pricing_info: prev.pricing_info.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please choose a photo under 5MB",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({ ...prev, profile_photo: file }));
    }
  };

  const handleBusinessPhotosUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is over 5MB and was skipped`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    
    setFormData(prev => ({
      ...prev,
      business_photos: [...prev.business_photos, ...validFiles].slice(0, 5) // Max 5 photos
    }));
  };

  const removeBusinessPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      business_photos: prev.business_photos.filter((_, i) => i !== index)
    }));
  };

  const uploadPhotoToStorage = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);
      
    if (uploadError) throw uploadError;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return data.publicUrl;
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

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use OpenStreetMap's Nominatim for reverse geocoding (free service)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
          );
          
          if (!response.ok) throw new Error('Failed to get location');
          
          const data = await response.json();
          
          // Extract city, region, and country for a nice readable format
          const { city, town, village, county, state, country } = data.address || {};
          const locationString = [
            city || town || village,
            county || state,
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
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        
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

  const validateStep = () => {
    if (currentStep === 0) {
      return formData.location.trim();
    }
    if (currentStep === 1 && profile?.role === 'provider') {
      return formData.business_name.trim() && 
             formData.business_email.trim() && 
             formData.business_phone.trim() && 
             formData.business_address.trim() && 
             formData.services_offered.length > 0;
    }
    if (currentStep === 2 && profile?.role === 'provider') {
      return formData.business_description.trim() && formData.years_experience.trim();
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (profile?.role === 'customer' || currentStep === 2) {
        handleComplete();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
    }
  };

  const handleCustomerProfileSubmit = async (customerData: any) => {
    setLoading(true);
    setUploadingPhoto(true);

    try {
      let profilePhotoUrl = '';

      // Upload profile photo if provided
      if (customerData.profile_photo) {
        profilePhotoUrl = await uploadPhotoToStorage(
          customerData.profile_photo, 
          'profile-photos', 
          user!.id
        );
      }

      setUploadingPhoto(false);

      // Update profile with customer data
      const profileUpdates = {
        name: customerData.full_name,
        phone: customerData.phone,
        location: customerData.location,
        bio: customerData.bio,
        avatar_url: profilePhotoUrl || profile?.avatar_url,
        privacy_settings: customerData.privacy_settings,
        gdpr_consent: customerData.gdpr_consent,
        terms_accepted: customerData.terms_accepted,
        consent_date: new Date().toISOString(),
        is_profile_complete: true
      };

      const { error: profileError } = await updateProfile(profileUpdates);
      if (profileError) throw profileError;

      toast({
        title: "Profile completed!",
        description: "Welcome to Open-Slot. You can now start booking appointments!",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error completing profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setUploadingPhoto(true);

    try {
      let profilePhotoUrl = '';
      let businessPhotoUrls: string[] = [];

      // Upload profile photo if provided
      if (formData.profile_photo) {
        profilePhotoUrl = await uploadPhotoToStorage(
          formData.profile_photo, 
          'profile-photos', 
          user!.id
        );
      }

      // Upload business photos if provider and photos provided
      if (profile?.role === 'provider' && formData.business_photos.length > 0) {
        businessPhotoUrls = await Promise.all(
          formData.business_photos.map(photo => 
            uploadPhotoToStorage(photo, 'business-photos', user!.id)
          )
        );
      }

      setUploadingPhoto(false);

      // Update profile
      const profileUpdates = {
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        avatar_url: profilePhotoUrl || profile?.avatar_url,
        is_profile_complete: true
      };

      const { error: profileError } = await updateProfile(profileUpdates);
      if (profileError) throw profileError;

      // If provider, create provider details
      if (profile?.role === 'provider') {
        const { error: providerError } = await supabase
          .from('provider_details')
          .upsert({
            user_id: user!.id,
            business_name: formData.business_name,
            business_email: formData.business_email || profile.email,
            business_phone: formData.business_phone,
            business_address: formData.business_address,
            business_description: formData.business_description,
            services_offered: formData.services_offered,
            business_website: formData.business_website,
            years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
            pricing_info: JSON.stringify(formData.pricing_info),
            operating_hours: JSON.stringify(formData.operating_hours),
            certifications: formData.certifications
          });

        if (providerError) throw providerError;

        // Create individual service records from pricing info
        if (formData.pricing_info.length > 0) {
          const serviceRecords = formData.pricing_info
            .filter(item => item.service.trim() && item.price.trim())
            .map(item => ({
              provider_id: user!.id,
              service_name: item.service.trim(),
              base_price: parseFloat(item.price) || null,
              duration_minutes: 60, // Default duration
              is_active: true
            }));

          if (serviceRecords.length > 0) {
            const { error: servicesError } = await supabase
              .from('provider_services')
              .upsert(serviceRecords, { 
                onConflict: 'provider_id,service_name',
                ignoreDuplicates: false 
              });

            if (servicesError) {
              console.error('Error creating service records:', servicesError);
              // Don't throw error here to avoid blocking onboarding completion
            }
          }
        }
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to Open-Slot",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error completing profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingPhoto(false);
    }
  };

  const getStepTitle = () => {
    if (currentStep === 0) return "Complete Your Profile";
    if (currentStep === 1) return "Business Information";
    if (currentStep === 2) return "Business Details";
    return "";
  };

  const getStepDescription = () => {
    if (currentStep === 0) return "Tell us about yourself";
    if (currentStep === 1) return "Set up your business basics";
    if (currentStep === 2) return "Add detailed business information";
    return "";
  };

  if (!profile) return null;

  const totalSteps = profile.role === 'provider' ? 3 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
      
      <Header />
      
      <div className="relative z-10 flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-2xl animate-fade-in">
          {/* Only show header and progress for providers */}
          {profile.role === 'provider' && (
            <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-center space-x-3 mb-8">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary-glow to-accent rounded-2xl flex items-center justify-center shadow-lg animate-scale-in">
                    <CheckCircle className="h-6 w-6 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-2xl blur opacity-20 animate-pulse"></div>
                </div>
                <div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                    Open-Slot
                  </span>
                  <div className="text-sm text-muted-foreground font-medium tracking-wide">
                    Business Setup
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
                  {getStepTitle()}
                </h1>
                <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {getStepDescription()}
                </p>
              </div>
              
              {/* Enhanced Progress Indicator */}
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-4">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div key={index} className="flex items-center">
                      <div className="relative">
                        <div
                          className={`w-4 h-4 rounded-full transition-all duration-500 ${
                            index <= currentStep 
                              ? 'bg-gradient-to-r from-primary to-primary-glow shadow-lg shadow-primary/30 scale-110' 
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        />
                        {index <= currentStep && (
                          <div className="absolute inset-0 w-4 h-4 rounded-full bg-gradient-to-r from-primary to-primary-glow animate-ping opacity-20"></div>
                        )}
                      </div>
                      {index < totalSteps - 1 && (
                        <div 
                          className={`w-12 h-0.5 mx-2 transition-all duration-500 ${
                            index < currentStep ? 'bg-gradient-to-r from-primary to-primary-glow' : 'bg-muted'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Customer gets clean stepper, Provider gets enhanced card wrapper */}
          {profile.role === 'customer' ? (
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-8">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary-glow to-accent rounded-2xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white drop-shadow-sm" />
                    </div>
                    <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-2xl blur opacity-20 animate-pulse"></div>
                  </div>
                  <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Open-Slot</span>
                </div>
              </div>
              
              {/* Customer Step-by-Step Profile */}
              <CustomerStepper
                initialData={{
                  phone: formData.phone,
                  location: formData.location,
                  bio: formData.bio,
                  privacy_settings: profile.privacy_settings || {
                    phone_visible: true,
                    email_visible: false,
                    location_visible: true
                  },
                  gdpr_consent: profile.gdpr_consent || false,
                  terms_accepted: profile.terms_accepted || false
                }}
                onComplete={handleCustomerProfileSubmit}
                isLoading={loading || uploadingPhoto}
                userFullName={profile.name || 'Customer'}
                userEmail={profile.email}
              />
            </div>
          ) : (
            <Card className="border-0 shadow-2xl bg-card/80 backdrop-blur-xl p-8 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {/* Card background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-card/50 via-card to-card/50 pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-glow to-accent"></div>
              
              <div className="relative z-10">
          {currentStep === 0 && profile.role === 'provider' && (
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {/* Step indicator */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  1
                </div>
                <h2 className="text-xl font-semibold text-foreground">Personal Information</h2>
              </div>

              <div className="space-y-4">
                <Label htmlFor="phone" className="text-base font-medium text-foreground">Phone Number</Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="location" className="text-base font-medium text-foreground">
                  Location <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="location"
                    placeholder="Enter your city or area"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="pl-12 pr-14 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={detectLocation}
                    disabled={loading}
                    className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-primary/10 rounded-full transition-all duration-200"
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="bio" className="text-base font-medium text-foreground">Personal Bio</Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="pl-12 min-h-[100px] text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm resize-none"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Optional: Share your professional background or personal touch</p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-foreground">Profile Photo</Label>
                <div className="flex items-center space-x-6">
                  {formData.profile_photo ? (
                    <div className="relative group animate-scale-in">
                      <img 
                        src={URL.createObjectURL(formData.profile_photo)} 
                        alt="Profile preview" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, profile_photo: null }))}
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors duration-300">
                      <Camera className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Label 
                      htmlFor="profile_photo" 
                      className="cursor-pointer inline-flex items-center justify-center rounded-lg text-base font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary-glow/5 hover:from-primary/10 hover:to-primary-glow/10 text-primary hover:text-primary-glow h-12 px-6 py-2 shadow-sm hover:shadow-md"
                    >
                      <Upload className="h-5 w-5 mr-3" />
                      Choose Photo
                    </Label>
                    <input
                      id="profile_photo"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload a professional profile photo (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && profile.role === 'provider' && (
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {/* Step indicator */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  2
                </div>
                <h2 className="text-xl font-semibold text-foreground">Business Information</h2>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_name" className="text-base font-medium text-foreground">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Building className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="business_name"
                    placeholder="Enter your business name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_email" className="text-base font-medium text-foreground">
                  Business Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="business_email"
                    type="email"
                    placeholder={profile.email || "Enter business email"}
                    value={formData.business_email || profile.email}
                    onChange={(e) => handleInputChange('business_email', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will be shown to customers for booking inquiries
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_phone" className="text-base font-medium text-foreground">
                  Business Phone Number <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="business_phone"
                    type="tel"
                    placeholder="Enter business phone number"
                    value={formData.business_phone}
                    onChange={(e) => handleInputChange('business_phone', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="same-as-personal"
                    checked={formData.business_phone === formData.phone && formData.phone !== ''}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleSameAsPersonalPhone();
                      }
                    }}
                  />
                  <Label htmlFor="same-as-personal" className="text-sm text-muted-foreground cursor-pointer flex items-center">
                    <Copy className="h-4 w-4 mr-1" />
                    Same as personal phone number
                  </Label>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_address" className="text-base font-medium text-foreground">
                  Business Address <span className="text-destructive">*</span>
                </Label>
                <LocationInput
                  placeholder="Enter your business address"
                  value={formData.business_address}
                  onChange={(value) => handleInputChange('business_address', value)}
                  className="h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                  autoDetect={true}
                />
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="private-address"
                    checked={formData.is_private_address}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private_address: !!checked }))}
                  />
                  <Label htmlFor="private-address" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    This is a private business address (my home)
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Your full address will not be visible on your profile. Only your general area will be shown to customers for privacy.
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-foreground">
                  Services Offered <span className="text-destructive">*</span>
                </Label>
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
                  <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-background/50 transition-colors">
                        <Checkbox
                          id={service.id}
                          checked={formData.services_offered.includes(service.id)}
                          onCheckedChange={() => handleServiceToggle(service.id)}
                          className="border-2 border-primary/30"
                        />
                        <Label
                          htmlFor={service.id}
                          className="text-sm font-medium cursor-pointer flex-1"
                        >
                          {service.name} 
                          <span className="text-muted-foreground font-normal ml-2">({service.category})</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Select all services you offer</p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-foreground">Business Photos</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="upload-later"
                    checked={formData.upload_photos_later}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      upload_photos_later: !!checked,
                      business_photos: checked ? [] : prev.business_photos // Clear photos if choosing to upload later
                    }))}
                  />
                  <Label htmlFor="upload-later" className="text-sm text-muted-foreground cursor-pointer">
                    I'll upload business photos later
                  </Label>
                </div>

                {!formData.upload_photos_later && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {formData.business_photos.map((photo, index) => (
                        <div key={index} className="relative group animate-scale-in">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Business photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border-2 border-border/50 shadow-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBusinessPhoto(index)}
                            className="absolute -top-2 -right-2 h-7 w-7 p-0 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {formData.business_photos.length < 5 && (
                        <Label 
                          htmlFor="business_photos" 
                          className="w-full h-24 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                        >
                          <Upload className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
                          <span className="text-xs text-muted-foreground mt-1">Add Photo</span>
                        </Label>
                      )}
                    </div>
                    <input
                      id="business_photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessPhotosUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload up to 5 business photos to showcase your work (max 5MB each)
                    </p>
                  </div>
                )}

                {formData.upload_photos_later && (
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/30">
                    <Camera className="h-4 w-4 inline mr-1" />
                    You can upload business photos later from your dashboard to showcase your work.
                  </p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && profile.role === 'provider' && (
            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {/* Step indicator */}
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  3
                </div>
                <h2 className="text-xl font-semibold text-foreground">Business Details</h2>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_description" className="text-base font-medium text-foreground">
                  Business Description <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Textarea
                    id="business_description"
                    placeholder="Describe your business and what makes you unique..."
                    value={formData.business_description}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    className="pl-12 min-h-[120px] text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm resize-none"
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">Tell customers about your expertise and services</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="years_experience" className="text-base font-medium text-foreground">
                  Years of Experience <span className="text-destructive">*</span>
                </Label>
                <div className="relative group">
                  <Star className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    placeholder="Years"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="business_website" className="text-base font-medium text-foreground">Business Website</Label>
                <div className="relative group">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="business_website"
                    placeholder="https://www.yourbusiness.com"
                    value={formData.business_website}
                    onChange={(e) => handleInputChange('business_website', e.target.value)}
                    className="pl-12 h-12 text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Optional: Add your website for more credibility</p>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-medium text-foreground">Operating Hours</Label>
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 border border-border/50 backdrop-blur-sm space-y-3">
                  {formData.operating_hours.map((dayHours, index) => (
                    <div key={dayHours.day} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 font-medium text-foreground">{dayHours.day}</div>
                        <Checkbox
                          checked={!dayHours.closed}
                          onCheckedChange={(checked) => handleOperatingHoursChange(index, 'closed', !checked)}
                          className="border-2 border-primary/30"
                        />
                        <span className="text-sm text-muted-foreground">Open</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => handleOperatingHoursChange(index, 'open', e.target.value)}
                          disabled={dayHours.closed}
                          className="w-28 h-9 text-sm"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => handleOperatingHoursChange(index, 'close', e.target.value)}
                          disabled={dayHours.closed}
                          className="w-28 h-9 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium text-foreground">Standard Price List</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPriceItem}
                    className="border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 border border-border/50 backdrop-blur-sm space-y-3">
                  {formData.pricing_info.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-background/30 rounded-lg">
                      <Input
                        placeholder="Service/Item name"
                        value={item.service}
                        onChange={(e) => updatePriceItem(index, 'service', e.target.value)}
                        className="flex-1 h-10 border-border/50"
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="0.00"
                          value={item.price}
                          onChange={(e) => updatePriceItem(index, 'price', e.target.value)}
                          className="w-28 h-10 pl-9 border-border/50"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePriceItem(index)}
                        className="h-10 w-10 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formData.pricing_info.length === 0 && (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">Click "Add Item" to create your price list</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Optional: Set standard prices for your services</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="certifications" className="text-base font-medium text-foreground">Certifications & Qualifications</Label>
                <div className="relative group">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Textarea
                    id="certifications"
                    placeholder="List your certifications, qualifications, or training..."
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    className="pl-12 min-h-[100px] text-base border-2 border-border/50 focus:border-primary/50 transition-all duration-300 bg-background/50 backdrop-blur-sm resize-none"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Optional: Add credentials to build trust with customers</p>
              </div>
            </div>
          )}

          {/* Enhanced Navigation - Only show for providers */}
          {profile.role === 'provider' && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/20">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  disabled={loading || uploadingPhoto}
                  className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={loading || uploadingPhoto || !validateStep()}
                className="min-w-[140px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading || uploadingPhoto ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    {uploadingPhoto ? "Uploading..." : "Saving..."}
                  </div>
                ) : (
                  <>
                    {currentStep === 2 ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Complete Profile
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;