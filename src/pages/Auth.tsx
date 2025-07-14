import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, UserCheck, Mail, Lock, Eye, EyeOff, Calendar, Building, TrendingUp, Clock, Star, CheckCircle, DollarSign, Users, MapPin } from 'lucide-react';
import Header from '@/components/ui/header';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL params for tab and role
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'provider') {
      setActiveTab('signup');
    }
    if (tab === 'provider') {
      setRole('provider');
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

  const handleSignIn = async (e: React.FormEvent) => {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const { error } = await signUp(email, password, role, fullName);
      
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
        // Redirect to sign in tab after successful signup
        setActiveTab('signin');
        setFullName('');
        setEmail(''); // Clear the email field for sign in
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">FillMyHole</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {role === 'provider' ? 'Grow Your Business' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'provider' 
              ? 'Join the platform designed to help beauty professionals thrive' 
              : 'Sign in to manage your appointments and bookings'
            }
          </p>
        </div>

        <Card className="border-0 shadow-elegant bg-card/50 backdrop-blur-sm p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
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
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
            </TabsContent>

            <TabsContent value="signup">
              {role === 'provider' ? (
                // Full Business Information Page
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <Building className="h-8 w-8 text-accent" />
                      <h2 className="text-2xl font-bold text-foreground">Built for Beauty Professionals</h2>
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Turn your empty appointment slots into revenue with customers who book immediately
                    </p>
                  </div>

                  {/* Key Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl">
                        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Maximize Your Earnings</h3>
                          <p className="text-sm text-muted-foreground">
                            Fill last-minute cancellations and gaps in your schedule with customers ready to book now
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Grow Your Client Base</h3>
                          <p className="text-sm text-muted-foreground">
                            Connect with new customers in your area who are actively seeking your services
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-accent/10 to-accent/5 rounded-xl">
                        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Flexible Control</h3>
                          <p className="text-sm text-muted-foreground">
                            Set your own hours, prices, and availability. Perfect for independent professionals
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Instant Bookings</h3>
                          <p className="text-sm text-muted-foreground">
                            Customers can book and pay instantly - no back-and-forth scheduling
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How It Works */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-foreground text-center">How FillMyHole Works for You</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
                          <span className="text-white font-bold">1</span>
                        </div>
                        <h4 className="font-semibold text-foreground">List Your Availability</h4>
                        <p className="text-sm text-muted-foreground">
                          Post your open slots with service details and pricing
                        </p>
                      </div>
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
                          <span className="text-white font-bold">2</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Get Instant Bookings</h4>
                        <p className="text-sm text-muted-foreground">
                          Customers find and book your services immediately
                        </p>
                      </div>
                      <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto">
                          <span className="text-white font-bold">3</span>
                        </div>
                        <h4 className="font-semibold text-foreground">Earn More Money</h4>
                        <p className="text-sm text-muted-foreground">
                          Fill your schedule and maximize your earning potential
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Perfect For */}
                  <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-foreground text-center">Perfect for Beauty & Service Professionals</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Eyelash Technicians</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Hair Stylists</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Nail Technicians</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Aestheticians</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Massage Therapists</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">Cleaning Services</span>
                      </div>
                    </div>
                  </div>

                  {/* Success Stories */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-foreground text-center">Real Results from Real Professionals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-primary fill-current" />
                          <Star className="h-5 w-5 text-primary fill-current" />
                          <Star className="h-5 w-5 text-primary fill-current" />
                          <Star className="h-5 w-5 text-primary fill-current" />
                          <Star className="h-5 w-5 text-primary fill-current" />
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "I've increased my monthly income by 35% just by listing my cancellations on FillMyHole. The platform is so easy to use!"
                        </p>
                        <p className="text-sm font-medium text-foreground">- Sarah M., Eyelash Technician</p>
                      </div>
                      <div className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-xl p-6 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-accent fill-current" />
                          <Star className="h-5 w-5 text-accent fill-current" />
                          <Star className="h-5 w-5 text-accent fill-current" />
                          <Star className="h-5 w-5 text-accent fill-current" />
                          <Star className="h-5 w-5 text-accent fill-current" />
                        </div>
                        <p className="text-sm text-muted-foreground italic">
                          "Perfect for my mobile nail business. I can update my availability anywhere and get bookings instantly."
                        </p>
                        <p className="text-sm font-medium text-foreground">- Jessica L., Mobile Nail Tech</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="text-center space-y-4 py-6">
                    <h3 className="text-2xl font-bold text-foreground">Ready to Grow Your Business?</h3>
                    <p className="text-muted-foreground">
                      Join hundreds of beauty professionals already earning more with FillMyHole
                    </p>
                    <Button
                      onClick={() => {
                        window.location.href = '/auth?tab=signup';
                      }}
                      variant="hero"
                      size="lg"
                      className="px-8"
                    >
                      <Building className="mr-2 h-5 w-5" />
                      Get Started Today
                    </Button>
                  </div>
                </div>
              ) : (
                // Regular customer signup form - only show when role is NOT provider
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
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
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
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
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
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
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className={password.length >= 8 ? 'text-green-500' : ''}>
                        ✓ At least 8 characters
                      </p>
                      <p className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
                        ✓ At least 1 uppercase letter
                      </p>
                      <p className={/\d/.test(password) ? 'text-green-500' : ''}>
                        ✓ At least 1 number
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
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
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default Auth;