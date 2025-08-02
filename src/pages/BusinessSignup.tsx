// Conversion-focused Business Signup page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, User, MapPin, Check, ArrowLeft, Calendar, Target, TrendingUp, PoundSterling, Users, Clock, Star } from 'lucide-react';
import { PostcodeLookup } from '@/components/ui/postcode-lookup-enhanced';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const BusinessSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [postcode, setPostcode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [serviceRadius, setServiceRadius] = useState('5');
  const [postcodeData, setPostcodeData] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const { signUp, user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

    if (!postcode.trim() || !latitude || !longitude) {
      toast({
        title: "Postcode required",
        description: "Please enter a valid UK postcode for your business location",
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
      const { error } = await signUp(email, password, 'provider', fullName, phone, postcode, businessName, latitude, longitude, parseInt(serviceRadius), postcodeData);
      
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

  // Show success message after signup
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                  alt="OpenSlot Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Welcome to Your Growth Journey!
              </h1>
              <p className="text-muted-foreground font-medium">
                Your 14-day free trial starts after email verification
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
                    Click the link to activate your account and start your free trial.
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>🚀 Next step:</strong> After verification, you'll be guided through setting up your business profile to start receiving bookings immediately.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-background to-sage-50/30 animate-fade-in">
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
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-7 h-7 md:w-8 md:h-8 object-contain"
              />
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label className="text-sm font-semibold text-foreground">Business Postcode</Label>
                <PostcodeLookup
                  value={postcode}
                  onChange={(data) => {
                    setPostcode(data.postcode);
                    setLocation(data.formattedAddress);
                    setLatitude(data.latitude);
                    setLongitude(data.longitude);
                    setPostcodeData(data.postcodeData);
                  }}
                  placeholder="Enter your business postcode (e.g. SW1A 1AA)"
                  className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400"
                  showCoverageRadius={false}
                />
              </div>

              {postcode && latitude && longitude && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">Service Radius</Label>
                  <Select value={serviceRadius} onValueChange={setServiceRadius}>
                    <SelectTrigger className="h-11 rounded-lg border-sage-200 focus:border-sage-400 focus:ring-sage-400">
                      <SelectValue placeholder="Select service radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mile radius</SelectItem>
                      <SelectItem value="3">3 miles radius</SelectItem>
                      <SelectItem value="5">5 miles radius</SelectItem>
                      <SelectItem value="10">10 miles radius</SelectItem>
                      <SelectItem value="15">15 miles radius</SelectItem>
                      <SelectItem value="20">20+ miles radius</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            <p className="text-sm text-muted-foreground mt-2">
              Looking to book appointments?{' '}
              <Link to="/signup/customer" className="text-sage-600 hover:text-sage-700 hover:underline font-semibold">
                Customer signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSignup;