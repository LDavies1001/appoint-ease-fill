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
import { User, Building, MapPin, Phone, FileText, CheckCircle, Clock, DollarSign, Mail, Globe, Star, Locate, Upload, X, Camera } from 'lucide-react';
import Header from '@/components/ui/header';

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
    certifications: ''
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

    if (profile.is_profile_complete) {
      navigate('/dashboard');
      return;
    }

    // DEBUG: Log profile information
    console.log('Profile data:', profile);
    console.log('User role:', profile.role);
    console.log('Current step:', currentStep);

    // Pre-fill form with existing data
    setFormData(prev => ({
      ...prev,
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || ''
    }));

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
      return formData.business_name.trim() && formData.services_offered.length > 0;
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
            business_description: formData.business_description,
            services_offered: formData.services_offered,
            business_website: formData.business_website,
            years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
            pricing_info: JSON.stringify(formData.pricing_info),
            operating_hours: JSON.stringify(formData.operating_hours),
            certifications: formData.certifications
          });

        if (providerError) throw providerError;
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to FillMyHole",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">FillMyHole</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getStepTitle()}
          </h1>
          <p className="text-muted-foreground mb-6">
            {getStepDescription()}
          </p>
          <div className="flex justify-center">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full mx-1 transition-all duration-300 ${
                  index <= currentStep ? 'bg-primary shadow-sm' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="Enter your city or area"
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
                    disabled={loading}
                    className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <Locate className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Personal Bio (if independent)</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="bio"
                    placeholder="Tell us a bit about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="pl-10 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Profile Photo</Label>
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
                        onClick={() => setFormData(prev => ({ ...prev, profile_photo: null }))}
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
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a profile photo (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && profile.role === 'provider' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="business_name"
                    placeholder="Enter your business name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Services Offered *</Label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={formData.services_offered.includes(service.id)}
                        onCheckedChange={() => handleServiceToggle(service.id)}
                      />
                      <Label
                        htmlFor={service.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {service.name} <span className="text-muted-foreground">({service.category})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Business Photos</Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {formData.business_photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={URL.createObjectURL(photo)} 
                          alt={`Business photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBusinessPhoto(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {formData.business_photos.length < 5 && (
                      <Label 
                        htmlFor="business_photos" 
                        className="w-full h-20 border-2 border-dashed border-muted-foreground/50 rounded-lg flex items-center justify-center cursor-pointer hover:border-muted-foreground/70 transition-colors"
                      >
                        <Upload className="h-6 w-6 text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground">
                    Upload up to 5 business photos (max 5MB each)
                  </p>
                </div>
              </div>

            </div>
          )}

          {currentStep === 2 && profile.role === 'provider' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_description">Business Description *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="business_description"
                    placeholder="Describe your business and what makes you unique..."
                    value={formData.business_description}
                    onChange={(e) => handleInputChange('business_description', e.target.value)}
                    className="pl-10 min-h-[80px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience *</Label>
                <div className="relative">
                  <Star className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="years_experience"
                    type="number"
                    min="0"
                    placeholder="Years"
                    value={formData.years_experience}
                    onChange={(e) => handleInputChange('years_experience', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_website">Business Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="business_website"
                    placeholder="https://www.yourbusiness.com"
                    value={formData.business_website}
                    onChange={(e) => handleInputChange('business_website', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Operating Hours</Label>
                <div className="space-y-2">
                  {formData.operating_hours.map((dayHours, index) => (
                    <div key={dayHours.day} className="flex items-center space-x-2 text-sm">
                      <div className="w-20 font-medium">{dayHours.day}</div>
                      <Checkbox
                        checked={!dayHours.closed}
                        onCheckedChange={(checked) => handleOperatingHoursChange(index, 'closed', !checked)}
                      />
                      <div className="flex items-center space-x-1">
                        <Input
                          type="time"
                          value={dayHours.open}
                          onChange={(e) => handleOperatingHoursChange(index, 'open', e.target.value)}
                          disabled={dayHours.closed}
                          className="w-24"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={dayHours.close}
                          onChange={(e) => handleOperatingHoursChange(index, 'close', e.target.value)}
                          disabled={dayHours.closed}
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Standard Price List</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPriceItem}
                  >
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.pricing_info.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Service/Item"
                        value={item.service}
                        onChange={(e) => updatePriceItem(index, 'service', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updatePriceItem(index, 'price', e.target.value)}
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePriceItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {formData.pricing_info.length === 0 && (
                    <p className="text-sm text-muted-foreground">Click "Add Item" to create your price list</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certifications">Certifications & Qualifications</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="certifications"
                    placeholder="List your certifications, qualifications, or training..."
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    className="pl-10 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={loading || uploadingPhoto}
              >
                Back
              </Button>
            )}
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={loading || uploadingPhoto || !validateStep()}
              className="ml-auto"
            >
              {loading || uploadingPhoto ? (
                uploadingPhoto ? "Uploading photos..." : "Saving..."
              ) : (
                <>
                  {profile.role === 'customer' || currentStep === 2 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Profile
                    </>
                  ) : (
                    "Continue"
                  )}
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default Onboarding;