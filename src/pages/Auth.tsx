// Redesigned Auth page following brand guidelines
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserCheck, Mail, Lock, Eye, EyeOff, Building, TrendingUp, Clock, CheckCircle, PoundSterling, Users, Search, Phone, Upload, AlertCircle, ArrowLeft, Calendar, Heart, MapPin, Award } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
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

  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Name required",
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

    setLoading(true);

    try {
      const { error } = await signUp(email, password, 'customer', fullName);
      
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

  // Brand Logo Component
  const BrandLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <img 
      src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
      alt="OpenSlot Logo" 
      className={`${className} object-contain`}
    />
  );

  // Role Selection Page
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-[200px] h-[200px]" />
              </div>
              <h1 className="font-bold text-foreground leading-[1.1] tracking-tight mb-4" 
                  style={{ fontSize: 'clamp(1.5rem, 6vw, 3.5rem)' }}>
                Join OpenSlot
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                Choose your account type to get started with the future of appointment booking
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Customer Option */}
              <Card 
                className="group relative bg-gradient-to-br from-rose-50/80 via-white/60 to-rose-100/80 backdrop-blur-sm border border-rose-200/40 rounded-xl md:rounded-2xl p-8 hover:shadow-xl hover:shadow-rose-100/25 cursor-pointer transition-all duration-500 hover:-translate-y-1 animate-scale-in"
                onClick={() => {
                  setSelectedRole('customer');
                  setShowRoleSelection(false);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/0 to-rose-100/20 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-200 to-rose-300 rounded-xl flex items-center justify-center mx-auto">
                    <Heart className="h-8 w-8 text-rose-700" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground">For Customers</h3>
                  <p className="text-muted-foreground font-medium">
                    Discover available slots near you instantly and book trusted professionals
                  </p>
                  <div className="space-y-3">
                    {[
                      'Book instantly, no waiting',
                      'Discover local providers', 
                      'Great last-minute deals'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300 hover:from-rose-200 hover:via-rose-300 hover:to-rose-400 text-rose-800 font-semibold py-3 rounded-lg">
                    Get Started as Customer
                  </Button>
                </div>
              </Card>

              {/* Business Option */}
              <Card 
                className="group relative bg-gradient-to-br from-sage-50/80 via-white/60 to-sage-100/80 backdrop-blur-sm border border-sage-200/40 rounded-xl md:rounded-2xl p-8 hover:shadow-xl hover:shadow-sage-100/25 cursor-pointer transition-all duration-500 hover:-translate-y-1 animate-scale-in"
                onClick={() => {
                  setSelectedRole('provider');
                  setShowRoleSelection(false);
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sage-50/0 to-sage-100/20 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-sage-200 to-sage-300 rounded-xl flex items-center justify-center mx-auto">
                    <Building className="h-8 w-8 text-sage-700" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground">For Businesses</h3>
                  <p className="text-muted-foreground font-medium">
                    Fill empty appointments automatically and grow your business with new customers
                  </p>
                  <div className="space-y-3">
                    {[
                      'Fill last-minute cancellations',
                      'Reach new customers',
                      'Increase revenue'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-muted-foreground">
                        <CheckCircle className="h-5 w-5 text-sage-500 flex-shrink-0" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300 hover:from-sage-200 hover:via-sage-300 hover:to-sage-400 text-sage-800 font-semibold py-3 rounded-lg">
                    Get Started as Business
                  </Button>
                </div>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="text-rose-400 hover:text-rose-500 font-semibold underline decoration-2 underline-offset-2">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message after signup
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-8 h-8 md:w-10 md:h-10" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Account Created Successfully!
              </h1>
              <p className="text-muted-foreground font-medium">
                Please check your email for verification before logging in
              </p>
            </div>

            <Card className="border border-rose-100/50 bg-white/60 backdrop-blur-sm shadow-xl rounded-xl md:rounded-2xl p-8 animate-scale-in">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Check Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification email to <strong className="text-foreground">{email}</strong>. 
                    Please click the link in the email to verify your account before logging in.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300 hover:from-rose-200 hover:via-rose-300 hover:to-rose-400 text-rose-800 font-semibold py-3 rounded-lg"
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

  // Customer Signup Form
  if (selectedRole === 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-rose-25 to-background animate-fade-in">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-rose-700 hover:text-rose-800 hover:bg-rose-100/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-7 h-7 md:w-8 md:h-8" />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Create Your Account
              </h1>
              <p className="text-muted-foreground font-medium">
                Discover available slots near you instantly
              </p>
            </div>

            <Card className="border border-rose-100/50 bg-white/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl md:rounded-2xl p-6 md:p-8 animate-scale-in">
              <form onSubmit={handleCustomerSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer-name" className="text-sm font-medium text-foreground">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-rose-600" />
                    <Input
                      id="customer-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 border-rose-200 focus:border-rose-500 focus:ring-rose-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-email" className="text-sm font-medium text-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-rose-600" />
                    <Input
                      id="customer-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-rose-200 focus:border-rose-500 focus:ring-rose-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-rose-600" />
                    <Input
                      id="customer-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-rose-200 focus:border-rose-500 focus:ring-rose-500/20 rounded-lg"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-rose-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-rose-600" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-confirm-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-rose-600" />
                    <Input
                      id="customer-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 border-rose-200 focus:border-rose-500 focus:ring-rose-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-rose-100 via-rose-200 to-rose-300 hover:from-rose-200 hover:via-rose-300 hover:to-rose-400 text-rose-800 font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/auth" className="text-rose-600 hover:text-rose-700 font-medium story-link">
                    Sign in here
                  </Link>
                </p>
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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-25 to-background animate-fade-in">
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
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-7 h-7 md:w-8 md:h-8" />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Create Your Business Account
              </h1>
              <p className="text-muted-foreground font-medium">
                Fill empty appointments automatically and grow your business
              </p>
            </div>

            <Card className="border border-sage-100/50 bg-white/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl md:rounded-2xl p-6 md:p-8 animate-scale-in">
              <form onSubmit={handleBusinessSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-sm font-medium text-foreground">Business Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-name"
                      type="text"
                      placeholder="Enter your business name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full-name" className="text-sm font-medium text-foreground">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-email" className="text-sm font-medium text-foreground">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-email"
                      type="email"
                      placeholder="Enter your business email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="07123456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-password" className="text-sm font-medium text-foreground">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-sage-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-sage-600" />
                      )}
                    </Button>
                  </div>
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < getPasswordStrength()
                              ? 'bg-sage-500'
                              : 'bg-sage-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-confirm-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-sage-600" />
                    <Input
                      id="business-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-sage-100 via-sage-200 to-sage-300 hover:from-sage-200 hover:via-sage-300 hover:to-sage-400 text-sage-800 font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  {loading ? 'Creating Account...' : 'Create Business Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/auth" className="text-sage-600 hover:text-sage-700 font-medium story-link">
                    Sign in here
                  </Link>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Conversion-Optimized Login Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50/30 via-background to-rose-50/20">
      <div className="container mx-auto px-4 py-8 flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          {/* Centered Login Form */}
            <Card className="border-2 border-sage-200/60 shadow-xl bg-white/95">
              <div className="p-8">
                <div className="text-center mb-6">
                  <BrandLogo className="w-[170px] h-[170px] mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Welcome Back
                  </h2>
                  <p className="text-muted-foreground">
                    Sign in to your OpenSlot account
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-sage-200 focus:border-sage-500 focus:ring-sage-500/20 bg-rose-50/50"
                        required
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-600" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 border-sage-200 focus:border-rose-400 focus:ring-rose-400/20 bg-rose-50/50"
                        required
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sage-600" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sage-600 hover:text-sage-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-br from-sage-200 to-sage-300 hover:from-sage-300 hover:to-sage-400 text-sage-800 font-semibold py-3"
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-sage-100 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      onClick={() => navigate('?tab=signup')}
                      className="text-rose-500 hover:text-rose-600 font-medium"
                    >
                      Sign up here
                    </button>
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