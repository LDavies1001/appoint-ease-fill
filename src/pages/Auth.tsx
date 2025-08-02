import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserCheck, Mail, Lock, Eye, EyeOff, Building, TrendingUp, Clock, CheckCircle, PoundSterling, Users, Search, Phone, Upload, AlertCircle, ArrowLeft, Calendar, Heart, MapPin, Award, Star, Shield, Zap } from 'lucide-react';
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
    const phoneRegex = /^(\\+44\\s?|0)[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\\s/g, ''));
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\\d/.test(password)) strength++;
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
    const hasNumber = /\\d/.test(password);
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

  // Conversion-focused Role Selection Page
  if (showRoleSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-accent/5 animate-fade-in">
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
          <div className="w-full max-w-5xl">
            {/* Conversion-focused header */}
            <div className="text-center mb-12 space-y-6">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-10 h-10" />
                <span className="text-3xl font-bold text-foreground">OpenSlot</span>
              </div>
              
              {/* Social proof banner */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium border border-green-200 animate-pulse">
                <Star className="h-4 w-4 text-green-600" />
                Join 1,000+ businesses already filling empty slots
              </div>

              <h1 className="font-bold text-foreground leading-tight tracking-tight text-4xl lg:text-6xl">
                Start Booking Smarter
                <span className="block text-primary">In Under 2 Minutes</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
                Choose your account type and join the revolution that's already transformed over 
                <span className="text-primary font-bold"> 10,000 appointments</span> this month alone
              </p>

              {/* Urgency element */}
              <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200 text-sm">
                <Clock className="h-4 w-4" />
                Limited early access - Join before slots fill up
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Customer Option - Benefits focused */}
              <Card 
                className="group relative bg-gradient-to-br from-rose-50/90 via-white/80 to-rose-100/90 backdrop-blur-sm border border-rose-200/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-rose-100/40 cursor-pointer transition-all duration-500 hover:-translate-y-2 animate-scale-in hover:border-rose-300/60"
                onClick={() => {
                  setSelectedRole('customer');
                  setShowRoleSelection(false);
                }}
              >
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  MOST POPULAR
                </div>
                
                <div className="relative text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-rose-200 to-rose-300 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Heart className="h-10 w-10 text-rose-700" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl lg:text-3xl font-bold text-foreground">Find Last-Minute Slots</h3>
                    <p className="text-rose-600 font-semibold text-lg">Save up to 40% on treatments</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: Zap, text: 'Book instantly - no waiting lists', color: 'text-rose-500' },
                      { icon: MapPin, text: 'Find providers within 5 miles', color: 'text-rose-500' },
                      { icon: PoundSterling, text: 'Exclusive last-minute discounts', color: 'text-rose-500' },
                      { icon: Shield, text: 'Verified professionals only', color: 'text-rose-500' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-left">
                        <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                        <span className="font-medium text-muted-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-br from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Start Finding Appointments
                    <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                  </Button>

                  <p className="text-xs text-rose-600">✓ Free forever • ✓ No booking fees</p>
                </div>
              </Card>

              {/* Business Option - ROI focused */}
              <Card 
                className="group relative bg-gradient-to-br from-sage-50/90 via-white/80 to-sage-100/90 backdrop-blur-sm border border-sage-200/50 rounded-2xl p-8 hover:shadow-2xl hover:shadow-sage-100/40 cursor-pointer transition-all duration-500 hover:-translate-y-2 animate-scale-in hover:border-sage-300/60"
                onClick={() => {
                  setSelectedRole('provider');
                  setShowRoleSelection(false);
                }}
              >
                <div className="absolute top-4 right-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  £500+ AVG BOOST
                </div>
                
                <div className="relative text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-sage-200 to-sage-300 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-10 w-10 text-sage-700" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl lg:text-3xl font-bold text-foreground">Fill Empty Slots</h3>
                    <p className="text-sage-600 font-semibold text-lg">Average £500+ monthly revenue boost</p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { icon: PoundSterling, text: 'Turn cancellations into revenue', color: 'text-sage-500' },
                      { icon: Users, text: 'Reach 1000+ local customers', color: 'text-sage-500' },
                      { icon: Clock, text: 'Fill slots within 30 minutes', color: 'text-sage-500' },
                      { icon: TrendingUp, text: 'Increase bookings by 25%', color: 'text-sage-500' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3 text-left">
                        <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                        <span className="font-medium text-muted-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full bg-gradient-to-br from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Start Filling Slots Now
                    <ArrowLeft className="h-5 w-5 ml-2 rotate-180" />
                  </Button>

                  <p className="text-xs text-sage-600">✓ 14-day free trial • ✓ No setup fees</p>
                </div>
              </Card>
            </div>

            {/* Trust signals and login link */}
            <div className="text-center mt-12 space-y-6">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span>Secure & GDPR compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span>Trusted by 1,000+ businesses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span>Setup in under 2 minutes</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="text-primary hover:text-primary/80 font-medium underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success message page
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-8 h-8 md:w-10 md:h-10" />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Welcome to the Future!
              </h1>
              <p className="text-muted-foreground font-medium">
                Check your email to verify your account and start booking
              </p>
            </div>

            <Card className="border border-primary/20 bg-gradient-to-br from-background/95 to-muted/10 backdrop-blur-sm shadow-xl rounded-xl md:rounded-2xl p-8 animate-scale-in">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Verification Email Sent</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification link to <strong className="text-foreground">{email}</strong>. 
                    Click the link to activate your account and start booking.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Pro tip:</strong> Check your spam folder if you don't see the email within 2 minutes.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-3 rounded-lg"
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

  // Customer Signup Form - benefit-focused
  if (selectedRole === 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-50/30 animate-fade-in">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRoleSelection(true)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-7 h-7 md:w-8 md:h-8" />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              
              {/* Benefits banner */}
              <div className="bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-rose-800 font-medium">
                  🎉 <strong>Limited time:</strong> Get 25% off your first 3 bookings
                </p>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Find Your Next Appointment
              </h1>
              <p className="text-muted-foreground font-medium mb-4">
                Join thousands discovering last-minute slots near them
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-rose-600">1000+</div>
                  <div className="text-xs text-muted-foreground">Providers</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-rose-600">30s</div>
                  <div className="text-xs text-muted-foreground">Avg. booking</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-rose-600">40%</div>
                  <div className="text-xs text-muted-foreground">Avg. savings</div>
                </div>
              </div>
            </div>

            <Card className="border border-rose-100/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl md:rounded-2xl p-8 animate-scale-in">
              <form onSubmit={handleCustomerSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-full rounded ${
                            i < getPasswordStrength() ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-rose-400 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold py-4 text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  {loading ? 'Creating Your Account...' : 'Start Finding Appointments'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By signing up, you agree to our{' '}
                  <Link to="/terms" className="text-rose-600 hover:underline">Terms</Link> and{' '}
                  <Link to="/privacy" className="text-rose-600 hover:underline">Privacy Policy</Link>
                </p>
              </form>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="text-rose-600 hover:text-rose-700 font-medium underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Business Signup Form - ROI focused
  if (selectedRole === 'provider') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-background to-sage-50/30 animate-fade-in">
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRoleSelection(true)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Options
          </Button>
        </div>
        
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <BrandLogo className="w-7 h-7 md:w-8 md:h-8" />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              
              {/* ROI banner */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-green-800 font-medium">
                  💰 <strong>Average business earns £500+ extra monthly</strong>
                </p>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Grow Your Business
              </h1>
              <p className="text-muted-foreground font-medium mb-4">
                Start filling empty slots automatically
              </p>

              {/* ROI stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="space-y-1">
                  <div className="text-lg font-bold text-sage-600">25%</div>
                  <div className="text-xs text-muted-foreground">More bookings</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-sage-600">£500+</div>
                  <div className="text-xs text-muted-foreground">Extra monthly</div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-sage-600">30min</div>
                  <div className="text-xs text-muted-foreground">Fill time</div>
                </div>
              </div>
            </div>

            <Card className="border border-sage-100/50 bg-white/80 backdrop-blur-sm shadow-xl rounded-xl md:rounded-2xl p-8 animate-scale-in">
              <form onSubmit={handleBusinessSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-sm font-semibold text-foreground">Business Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Your business name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-foreground">Business Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@business.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="07123 456 789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 w-full rounded ${
                            i < getPasswordStrength() ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-sage-500 to-sage-600 hover:from-sage-600 hover:to-sage-700 text-white font-bold py-4 text-lg rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  {loading ? 'Creating Business Account...' : 'Start Your 14-Day Free Trial'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  14-day free trial, then £29/month. Cancel anytime.{' '}
                  <Link to="/terms" className="text-sage-600 hover:underline">Terms apply</Link>
                </p>
              </form>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth" className="text-sage-600 hover:text-sage-700 font-medium underline underline-offset-4">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Clean, simple login form matching the screenshot
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 animate-fade-in">
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
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <BrandLogo className="w-8 h-8 md:w-10 md:h-10" />
              <span className="text-2xl font-bold text-foreground">OpenSlot</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground font-medium">
              Sign in to continue booking smarter
            </p>
          </div>

          <Card className="border border-primary/20 bg-white/90 backdrop-blur-sm shadow-xl rounded-xl md:rounded-2xl p-8 animate-scale-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-lg focus:ring-primary focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-lg focus:ring-primary focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold py-4 text-lg rounded-lg transition-all duration-300"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Card>

          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Don't have an account?
            </p>
            <Link to="/auth?tab=signup">
              <Button 
                variant="outline" 
                className="w-full border-primary/20 text-primary hover:bg-primary/5 font-semibold py-3 rounded-lg"
              >
                Create Account - It's Free!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
