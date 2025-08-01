import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, User, MapPin, Check, ArrowLeft, Calendar, Target } from 'lucide-react';
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

  // Field validation helpers
  const isEmailValid = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isPasswordMatching = () => {
    return password && confirmPassword && password === confirmPassword;
  };

  const isFieldValid = (field: string, value: string) => {
    switch (field) {
      case 'businessName':
        return value.trim().length >= 2;
      case 'fullName':
        return value.trim().length >= 2;
      case 'email':
        return isEmailValid(value);
      case 'phone':
        return validatePhone(value);
      case 'location':
        return value.trim().length >= 3;
      case 'postcode':
        return value.trim().length >= 5 && latitude !== null && longitude !== null;
      case 'password':
        return getPasswordStrength() >= 4;
      case 'confirmPassword':
        return isPasswordMatching();
      default:
        return false;
    }
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-6">
                {/* OpenSlot Logo */}
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-rose-700" />
                </div>
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Business Account Created!
              </h1>
              <p className="text-muted-foreground">
                Please check your email for verification before logging in
              </p>
            </div>

            <Card className="bg-white/60 backdrop-blur-sm shadow-elegant p-8 rounded-2xl border border-sage-100/50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-sage-50 border border-sage-200 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-sage-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to <strong className="text-sage-600">{email}</strong>. 
                  Please click the link in the email to verify your account before logging in.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full mt-6 bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 text-white rounded-xl h-12 font-semibold"
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
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-25 to-background">
      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center bg-sage-50 border border-sage-200 rounded-full px-4 py-2 text-sm text-sage-700">
              <span className="w-6 h-6 bg-sage-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</span>
              Step 1 of 2: Business Details
            </div>
          </div>

          {/* Main Headings */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Create Your Business Account
            </h1>
            <p className="text-xl text-muted-foreground">
              Get started in under 2 minutes – it's free
            </p>
          </div>

          {/* Form Container */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-elegant rounded-2xl border border-sage-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="p-8 lg:p-12">
              {/* Back to Home Button */}
              <div className="mb-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Business Information Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-sage-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Building className="h-5 w-5 text-sage-600" />
                      Business Information
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Name */}
                    <div className="space-y-3">
                      <Label htmlFor="business-name" className="text-sm font-semibold text-foreground">Business Name</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="business-name"
                          type="text"
                          placeholder="e.g. Bella Beauty Salon"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        {businessName && isFieldValid('businessName', businessName) && (
                          <div className="absolute right-4 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Your Name */}
                    <div className="space-y-3">
                      <Label htmlFor="full-name" className="text-sm font-semibold text-foreground">Your Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="e.g. Sarah Johnson"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        {fullName && isFieldValid('fullName', fullName) && (
                          <div className="absolute right-4 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-sage-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-5 w-5 text-sage-600" />
                      Contact Details
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email */}
                    <div className="space-y-3">
                      <Label htmlFor="business-email" className="text-sm font-semibold text-foreground">Business Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="business-email"
                          type="email"
                          placeholder="hello@bellasalon.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        {email && isFieldValid('email', email) && (
                          <div className="absolute right-4 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Business Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="07123 456789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        {phone && isFieldValid('phone', phone) && (
                          <div className="absolute right-4 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Customers will use this to contact you</p>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-sage-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-sage-600" />
                      Business Location & Service Area
                    </h3>
                  </div>
                  
                  {/* Postcode Lookup */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sage-600" />
                      Business Postcode
                    </Label>
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
                      className="h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                      showCoverageRadius={false}
                    />
                    <p className="text-sm text-muted-foreground">
                      You can add more service areas later in your profile settings
                    </p>
                  </div>

                  {/* Service Radius */}
                  {postcode && latitude && longitude && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Target className="h-4 w-4 text-sage-600" />
                        How far will you travel for appointments?
                      </Label>
                      <Select value={serviceRadius} onValueChange={setServiceRadius}>
                        <SelectTrigger className="h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base">
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
                      <p className="text-sm text-muted-foreground">
                        This helps customers know if you can provide services in their area
                      </p>
                    </div>
                  )}
                </div>

                {/* Security Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-sage-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Lock className="h-5 w-5 text-sage-600" />
                      Account Security
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-14 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-sage-400 hover:text-sage-600 transition-colors z-20"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {password && isFieldValid('password', password) && (
                          <div className="absolute right-12 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {password && (
                        <div className="space-y-2">
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 flex-1 rounded-full transition-colors ${
                                  i < getPasswordStrength() ? 'bg-gradient-to-r from-sage-500 to-sage-600' : 'bg-sage-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Password strength: {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][getPasswordStrength() - 1] || 'Very Weak'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className="text-sm font-semibold text-foreground">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-sage-400 z-10" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-sage-200 focus:border-sage-500 focus:ring-sage-200 text-base"
                          required
                        />
                        {confirmPassword && isFieldValid('confirmPassword', confirmPassword) && (
                          <div className="absolute right-4 top-4 text-sage-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 rounded-2xl text-lg font-bold bg-gradient-to-r from-provider to-provider-glow hover:from-provider-glow hover:to-provider text-provider-foreground shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Your Account...
                      </div>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>

                {/* Footer Links */}
                <div className="text-center space-y-4 pt-6 border-t border-sage-100">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/auth" className="text-sage-600 hover:text-sage-700 hover:underline font-semibold">
                      Sign in here
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Want to join as a customer?{' '}
                    <Link to="/signup/customer" className="text-sage-600 hover:text-sage-700 hover:underline font-semibold">
                      Create customer account
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </Card>

          {/* Benefits Section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-sage-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-sage-50 border border-sage-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-sage-600" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Instant Bookings</h4>
              <p className="text-sm text-muted-foreground">Get notified immediately when customers book your available slots</p>
            </div>
            
            <div className="p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-sage-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-sage-50 border border-sage-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-6 w-6 text-sage-600" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Fill Empty Slots</h4>
              <p className="text-sm text-muted-foreground">Turn your downtime into revenue by offering last-minute appointments</p>
            </div>
            
            <div className="p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-sage-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-sage-50 border border-sage-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-sage-600" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">Local Customers</h4>
              <p className="text-sm text-muted-foreground">Connect with customers in your area looking for appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSignup;