import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserCheck, Mail, Lock, Eye, EyeOff, Building, TrendingUp, Clock, CheckCircle, PoundSterling, Users, Search } from 'lucide-react';
import { LocationInput } from '@/components/ui/location-input';
import Header from '@/components/ui/header';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBusinessSignup, setShowBusinessSignup] = useState(false);
  
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL params for provider info page
    const tab = searchParams.get('tab');
    if (tab === 'provider') {
      setShowBusinessSignup(false); // Show info page, not signup form
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && profile) {
      if (profile.is_profile_complete) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, profile, navigate]);

  const handleBusinessSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessName.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name",
        variant: "destructive"
      });
      return;
    }
    
    if (!fullName.trim()) {
      toast({
        title: "Full name required",
        description: "Please enter your full name",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too weak",
        description: "Password must be at least 8 characters",
        variant: "destructive"
      });
      return;
    }

    // Check for password strength requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    if (!hasUppercase || !hasNumber) {
      toast({
        title: "Password too weak",
        description: "Password must contain at least 1 uppercase letter and 1 number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, 'provider', fullName);
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email for verification",
        });
        // Clear form
        setBusinessName('');
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (showBusinessSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">Open-Slot</span>
            </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create Your Business Account
              </h1>
              <p className="text-muted-foreground">
                Join the platform designed to help beauty professionals thrive
              </p>
            </div>

            <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
              <form onSubmit={handleBusinessSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-email"
                      type="email"
                      placeholder="Enter your business email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-location">Business Location</Label>
                  <LocationInput 
                    placeholder="Business Location" 
                    className="h-11 text-sm bg-white/80" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="business-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-business-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-business-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Business Account"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                <Building className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">Open-Slot</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Grow Your Business
            </h1>
            <p className="text-muted-foreground">
              Join the platform designed to help beauty professionals thrive - Turn empty appointment slots into instant revenue
            </p>
          </div>

          <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
            <div className="space-y-8 py-4">
              {/* Hero Section - Removed as text is now combined above */}

              {/* Key Benefits - Fixed heights for consistent sizing with pink, green, green, pink color pattern */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 bg-primary/10 rounded-lg h-[140px]">
                    <PoundSterling className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm mb-2">Fill Last-Minute Cancellations</h3>
                      <p className="text-xs text-muted-foreground">
                        Connect with customers who need appointments right now
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-accent/10 rounded-lg h-[140px]">
                    <TrendingUp className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm mb-2">Increase Your Revenue</h3>
                      <p className="text-xs text-muted-foreground">
                        Maximise your booking capacity and reduce downtime
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 bg-accent/10 rounded-lg h-[140px]">
                    <Users className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm mb-2">Reach New Customers</h3>
                      <p className="text-xs text-muted-foreground">
                        Get found by customers in your area looking for services
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-primary/10 rounded-lg h-[140px]">
                    <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm mb-2">Complete Control</h3>
                      <p className="text-xs text-muted-foreground">
                        Set your own schedule, prices, and availability to work exactly how you want
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perfect For - Updated with Deep Cleans */}
              <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg p-5 text-center">
                <h3 className="font-semibold text-foreground mb-3">Perfect for:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Eyelash Technicians</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Hair Stylists</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Nail Technicians</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-accent" />
                    <span className="text-foreground">Deep Cleans</span>
                  </div>
                </div>
              </div>

              {/* Simple CTA - Updated to go to business signup */}
              <div className="text-center space-y-3 pt-4">
                <h3 className="text-lg font-semibold text-foreground">Ready to grow your business?</h3>
                <Button
                  onClick={() => {
                    setShowBusinessSignup(true); // Now show the signup form
                  }}
                  variant="hero"
                  size="lg"
                  className="px-8"
                >
                  Get Started Today
                </Button>
                <p className="text-xs text-muted-foreground">
                  Join hundreds of professionals already using Open-Slot
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;