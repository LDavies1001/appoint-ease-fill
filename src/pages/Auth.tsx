// Fixed duplicate header issue
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserCheck, Mail, Lock, Eye, EyeOff, Building, TrendingUp, Clock, CheckCircle, PoundSterling, Users, Search, Phone, Upload, AlertCircle, ArrowLeft } from 'lucide-react';
import { LocationInput } from '@/components/ui/location-input';


const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBusinessSignup, setShowBusinessSignup] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear form data when switching tabs
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setBusinessName('');
    setLocation('');
    setPhone('');
    setShowPassword(false);
    setShowSuccessMessage(false);
    
    // Reset all state when URL changes
    setShowBusinessSignup(false);
    setShowRoleSelection(false);
    setSelectedRole(null);
    
    // Check URL params for different flows
    const tab = searchParams.get('tab');
    const message = searchParams.get('message');
    
    if (message === 'check-email') {
      setShowSuccessMessage(true);
    } else if (tab === 'provider') {
      // Show business info page - no state changes needed
    } else if (tab === 'signup') {
      setShowRoleSelection(true); // Show role selection page
    }
    // For no tab or any other tab, show login form (default behavior)
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

  const validatePhone = (phone: string) => {
    // Basic UK phone number validation
    const phoneRegex = /^(\+44\s?|0)[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

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

    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid UK phone number",
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
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      toast({
        title: "Password too weak",
        description: "Password must contain uppercase, lowercase, number, and special character",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const role = selectedRole === 'provider' ? 'provider' : 'customer';
      const { error } = await signUp(email, password, role, fullName, phone, '', businessName);
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setShowSuccessMessage(true);
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

  // Role Selection Page
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden w-full">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">Open-Slot</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Join Open-Slot
              </h1>
              <p className="text-muted-foreground">
                Choose your account type to get started
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer Option */}
              <Card 
                className="p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/30 cursor-pointer transition-all duration-300 hover:shadow-medium"
                onClick={() => {
                  setSelectedRole('customer');
                  setShowRoleSelection(false);
                }}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">I'm a Customer</h3>
                  <p className="text-muted-foreground">
                    Book last-minute appointments and find available slots instantly
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Find instant availability</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Book trusted professionals</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span>Get great deals</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Business Option */}
              <Card 
                className="p-8 border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 hover:border-accent/30 cursor-pointer transition-all duration-300 hover:shadow-medium"
                onClick={() => {
                  setSelectedRole('provider');
                  setShowRoleSelection(false);
                }}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto">
                    <Building className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">I'm a Business</h3>
                  <p className="text-muted-foreground">
                    Fill empty slots and grow your business with new customers
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <span>Fill last-minute cancellations</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <span>Reach new customers</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-accent" />
                      <span>Increase revenue</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message after signup
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden w-full">
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">Open-Slot</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Account Created Successfully!
              </h1>
              <p className="text-muted-foreground">
                Please check your email for verification before logging in
              </p>
            </div>

            <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to <strong>{email}</strong>. 
                  Please click the link in the email to verify your account before logging in.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                >
                  Go to Login
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Business Signup Form  
  if (selectedRole === 'provider') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-100 to-background overflow-x-hidden w-full">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sage-700 hover:text-sage-800 hover:bg-sage-100/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center">
                  <Building className="h-4 w-4 md:h-5 md:w-5 text-rose-700" />
                </div>
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Create Your Business Account
              </h1>
              <p className="text-muted-foreground">
                Fill empty appointments automatically and grow your business
              </p>
            </div>

            <Card className="border border-sage-100/50 bg-white/60 backdrop-blur-sm shadow-elegant hover:shadow-lg transition-all duration-300 rounded-xl md:rounded-2xl p-6 md:p-8">
              <form onSubmit={handleBusinessSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-email">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-email"
                      type="email"
                      placeholder="Enter your business email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="07123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="business-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-sage-600 hover:text-sage-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {/* Password Requirements */}
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">Password must contain:</p>
                    <div className="grid grid-cols-2 gap-1">
                      <div className={`flex items-center space-x-1 ${password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className="h-3 w-3" />
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Uppercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Lowercase letter</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/\d/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Number</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Special character</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-business-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="confirm-business-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Certification Upload Option */}
                <div className="space-y-2">
                  <Label>Certifications & Awards (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Upload your professional certifications and awards to build trust with customers
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can add these later in your profile settings
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white shadow-sm transition-all duration-300"
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

  // Default behavior - show business info page for provider tab, or login/signup for others
  if (searchParams.get('tab') === 'provider') {
    // Business Info Page (original provider page)
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
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
                {/* Key Benefits */}
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

                {/* Perfect For */}
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

                {/* CTA */}
                <div className="text-center space-y-3 pt-4">
                  <h3 className="text-lg font-semibold text-foreground">Ready to grow your business?</h3>
                  <Button
                    onClick={() => {
                      setSelectedRole('provider');
                      setShowRoleSelection(false);
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
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  // Customer Signup Form or Login (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold text-foreground">Open-Slot</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to your account
            </p>
          </div>

          <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth?tab=signup" className="text-primary hover:text-primary/80 transition-colors">
                  Sign up here
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;