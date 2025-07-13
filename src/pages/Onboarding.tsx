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
import { User, Building, MapPin, Phone, FileText, CheckCircle } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
    business_name: '',
    services_offered: [] as string[],
    availability_notes: ''
  });
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  
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

    // Pre-fill form with existing data
    setFormData(prev => ({
      ...prev,
      name: profile.name || '',
      phone: profile.phone || '',
      location: profile.location || '',
      bio: profile.bio || ''
    }));

    // Fetch services
    fetchServices();
  }, [user, profile, navigate]);

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

  const validateStep = () => {
    if (currentStep === 0) {
      return formData.name.trim() && formData.location.trim();
    }
    if (currentStep === 1 && profile?.role === 'provider') {
      return formData.business_name.trim() && formData.services_offered.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (profile?.role === 'customer' || currentStep === 1) {
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

    try {
      // Update profile
      const profileUpdates = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
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
            services_offered: formData.services_offered,
            availability_notes: formData.availability_notes
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
    }
  };

  const getStepTitle = () => {
    if (currentStep === 0) return "Complete Your Profile";
    if (currentStep === 1) return "Business Information";
    return "";
  };

  const getStepDescription = () => {
    if (currentStep === 0) return "Tell us about yourself";
    if (currentStep === 1) return "Set up your business details";
    return "";
  };

  if (!profile) return null;

  const totalSteps = profile.role === 'provider' ? 2 : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {getStepTitle()}
          </h1>
          <p className="text-muted-foreground">
            {getStepDescription()}
          </p>
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full mx-1 ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="card-elegant p-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

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
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
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

              <div className="space-y-2">
                <Label htmlFor="availability_notes">Availability Notes</Label>
                <Textarea
                  id="availability_notes"
                  placeholder="Any notes about your general availability..."
                  value={formData.availability_notes}
                  onChange={(e) => handleInputChange('availability_notes', e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={loading}
              >
                Back
              </Button>
            )}
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={loading || !validateStep()}
              className="ml-auto"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  {profile.role === 'customer' || currentStep === 1 ? (
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
  );
};

export default Onboarding;