import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustomerStepper } from '@/components/customer/CustomerStepper';
import BusinessProfileForm from '@/components/business/BusinessProfileForm';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Heart,
  Scissors,
  Camera
} from 'lucide-react';

interface OnboardingFlowProps {
  initialRole?: 'customer' | 'provider';
}

type OnboardingStep = 'role-selection' | 'customer-setup' | 'business-setup' | 'completion';

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ initialRole }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    initialRole ? (initialRole === 'customer' ? 'customer-setup' : 'business-setup') : 'role-selection'
  );
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(initialRole || null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Update progress based on current step
    const progressMap = {
      'role-selection': 25,
      'customer-setup': 50,
      'business-setup': 50,
      'completion': 100
    };
    setProgress(progressMap[currentStep]);
  }, [currentStep]);

  const handleRoleSelection = async (role: 'customer' | 'provider') => {
    setLoading(true);
    try {
      // Update user role in the database
      await updateProfile({ role, active_role: role });
      setSelectedRole(role);
      
      if (role === 'customer') {
        setCurrentStep('customer-setup');
      } else {
        setCurrentStep('business-setup');
      }
      
      toast({
        title: "Role selected!",
        description: `Welcome! Let's set up your ${role === 'customer' ? 'customer' : 'business'} profile.`
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update your role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  const handleCustomerComplete = async (customerData: any) => {
    setLoading(true);
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

      // Update profile with customer data
      const profileUpdates = {
        name: customerData.phone || customerData.phone, // fallback to phone if name not provided
        phone: customerData.phone,
        location: customerData.location || customerData.postcode, // Use formatted address or postcode
        bio: customerData.bio,
        avatar_url: profilePhotoUrl || profile?.avatar_url,
        privacy_settings: customerData.privacy_settings,
        gdpr_consent: customerData.gdpr_consent,
        terms_accepted: customerData.terms_accepted,
        consent_date: new Date().toISOString(),
        is_profile_complete: true
      };

      await updateProfile(profileUpdates);
      setCurrentStep('completion');
    } catch (error: any) {
      console.error('Customer profile completion error:', error);
      toast({
        title: "Error completing profile",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleBusinessComplete = () => {
    setCurrentStep('completion');
    toast({
      title: "Business profile created!",
      description: "Your business profile is now set up and ready to receive bookings."
    });
  };

  const handleOnboardingComplete = () => {
    // Clear any saved onboarding data
    if (user?.id) {
      localStorage.removeItem(`onboarding_form_${user.id}`);
      localStorage.removeItem(`onboarding_step_${user.id}`);
    }

    // Navigate to appropriate dashboard
    if (selectedRole === 'customer') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const renderRoleSelection = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Sparkles className="h-16 w-16 text-primary animate-pulse" />
            <div className="absolute inset-0 h-16 w-16 bg-primary/20 rounded-full animate-ping" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Welcome to OpenSlot!
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Let's get you set up. Choose how you'd like to use OpenSlot:
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Customer Option */}
        <Card className="group cursor-pointer border-2 border-transparent hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover-scale">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">I'm a Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Book appointments with local beauty professionals, salons, and wellness providers.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Scissors className="h-3 w-3 mr-1" />
                Hair & Beauty
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Camera className="h-3 w-3 mr-1" />
                Photography
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Star className="h-3 w-3 mr-1" />
                Wellness
              </Badge>
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handleRoleSelection('customer')}
              disabled={loading}
            >
              Continue as Customer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Business Option */}
        <Card className="group cursor-pointer border-2 border-transparent hover:border-green-200 hover:shadow-lg transition-all duration-300 hover-scale">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-green-50 rounded-full w-20 h-20 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Building2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">I'm a Business Owner</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Set up your business profile to accept bookings and grow your client base.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                📅 Bookings
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                💼 Profile
              </Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                📈 Growth
              </Badge>
            </div>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleRoleSelection('provider')}
              disabled={loading}
            >
              Continue as Business
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCustomerSetup = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-primary">Customer Profile Setup</h2>
        <p className="text-muted-foreground">Let's personalize your booking experience</p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <CustomerStepper
          userFullName={profile?.name || user?.email?.split('@')[0] || 'there'}
          userEmail={user?.email || ''}
          initialData={{
            phone: profile?.phone || '',
            location: profile?.location || '',
            postcode: profile?.location || '', // Use location as postcode if it exists
            latitude: null, // We don't store coordinates in profiles yet
            longitude: null,
            postcodeData: null,
            bio: profile?.bio || '',
            privacy_settings: profile?.privacy_settings || {
              phone_visible: true,
              email_visible: false,
              location_visible: true,
            },
            gdpr_consent: profile?.gdpr_consent || false,
            terms_accepted: profile?.terms_accepted || false,
          }}
          onComplete={handleCustomerComplete}
          isLoading={loading}
        />
      </div>
    </div>
  );

  const renderBusinessSetup = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-green-600">Business Profile Setup</h2>
        <p className="text-muted-foreground">Create your professional presence</p>
      </div>
      
      <BusinessProfileForm
        mode="create"
        onSuccess={handleBusinessComplete}
      />
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center space-y-8 animate-fade-in">
      <div className="flex justify-center">
        <div className="relative">
          <CheckCircle className="h-24 w-24 text-green-500" />
          <div className="absolute inset-0 h-24 w-24 bg-green-500/20 rounded-full animate-ping" />
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-green-600">All Set! 🎉</h2>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          {selectedRole === 'customer' 
            ? "Your profile is complete! You can now discover and book with amazing local businesses."
            : "Your business profile is live! Start accepting bookings and growing your client base."
          }
        </p>
      </div>

      <Button 
        size="lg"
        className={`px-8 py-3 text-lg ${
          selectedRole === 'customer' 
            ? 'bg-primary hover:bg-primary/90' 
            : 'bg-green-600 hover:bg-green-700'
        } text-white`}
        onClick={handleOnboardingComplete}
      >
        {selectedRole === 'customer' ? 'Start Booking!' : 'Go to Dashboard'}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Onboarding Progress
            </span>
            <span className="text-sm font-medium text-rose-600">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2 [&_.bg-primary]:bg-gradient-to-r [&_.bg-primary]:from-rose-200 [&_.bg-primary]:to-rose-300" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {currentStep === 'role-selection' && renderRoleSelection()}
          {currentStep === 'customer-setup' && renderCustomerSetup()}
          {currentStep === 'business-setup' && renderBusinessSetup()}
          {currentStep === 'completion' && renderCompletion()}
        </div>
      </div>
    </div>
  );
};