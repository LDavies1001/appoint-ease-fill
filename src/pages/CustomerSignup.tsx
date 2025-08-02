import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, Heart, ArrowLeft, MapPin, Check } from 'lucide-react';
import { PostcodeLookup } from '@/components/ui/postcode-lookup-enhanced';

// Fixed import issue - using PostcodeLookup instead of LocationInput
import { sanitizeInput, validateEmail, validatePhone, validatePassword, rateLimitCheck } from '@/utils/validation';

const CustomerSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [postcode, setPostcode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
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

  const getPasswordStrength = () => {
    const validation = validatePassword(password);
    return validation.score;
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
      case 'fullName':
        return value.trim().length >= 2;
      case 'email':
        return isEmailValid(value);
      case 'phone':
        return !value || validatePhone(value);
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
    
    // Rate limiting check
    if (!rateLimitCheck('signup', 3, 10 * 60 * 1000)) { // 3 attempts per 10 minutes
      toast({
        title: "Too many attempts",
        description: "Please wait before trying again",
        variant: "destructive"
      });
      return;
    }

    // Sanitize inputs
    const sanitizedFullName = sanitizeInput(fullName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedLocation = sanitizeInput(location);

    // Validate inputs
    if (!sanitizedFullName.trim() || sanitizedFullName.length < 2) {
      toast({
        title: "Invalid name",
        description: "Please enter a valid full name (at least 2 characters)",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid UK phone number",
        variant: "destructive"
      });
      return;
    }

    if (!postcode.trim() || !latitude || !longitude) {
      toast({
        title: "Location required",
        description: "Please enter your postcode so we can show you available services",
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

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Password too weak",
        description: passwordValidation.errors[0],
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(
        sanitizedEmail, 
        password, 
        'customer', 
        sanitizedFullName, 
        sanitizedPhone, 
        postcode || sanitizedLocation,
        undefined, // businessName - not needed for customers
        latitude,
        longitude,
        undefined, // serviceRadius - not needed for customers
        postcodeData
      );
      
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
                <img 
                  src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                  alt="OpenSlot Logo" 
                  className="w-12 h-12 object-contain"
                />
                <span className="text-2xl font-bold text-foreground">OpenSlot</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Customer Account Created!
              </h1>
              <p className="text-muted-foreground">
                Please check your email for verification before logging in
              </p>
            </div>

            <Card className="bg-white/60 backdrop-blur-sm shadow-elegant p-8 rounded-2xl border border-blush-100/50">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blush-50 border border-blush-200 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-blush-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to <strong className="text-blush-600">{email}</strong>. 
                  Please click the link in the email to verify your account before logging in.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full mt-6 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl h-12 font-semibold shadow-lg"
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
    <div className="min-h-screen bg-gradient-to-br from-blush-50 via-blush-25 to-background">
      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center bg-blush-50 border border-blush-200 rounded-full px-4 py-2 text-sm text-blush-700">
              <span className="w-6 h-6 bg-blush-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-3">1</span>
              Step 1 of 2: Personal Details
            </div>
          </div>

          {/* Main Headings */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center space-x-3 mb-6">
              {/* OpenSlot Logo */}
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-12 h-12 object-contain"
              />
              <span className="text-2xl font-bold text-foreground">OpenSlot</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Create Your Customer Account
            </h1>
            <p className="text-xl text-muted-foreground">
              Join thousands of customers discovering amazing beauty services
            </p>
          </div>

          {/* Form Container */}
          <Card className="bg-white/60 backdrop-blur-sm shadow-elegant rounded-2xl border border-blush-100/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden">
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
                
                {/* Personal Information Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-blush-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-blush-600" />
                      Personal Information
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-3">
                      <Label htmlFor="full-name" className="text-sm font-semibold text-foreground">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-4 h-5 w-5 text-blush-400 z-10" />
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="e.g. Sarah Johnson"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                          variant="customer"
                          required
                        />
                        {fullName && isFieldValid('fullName', fullName) && (
                          <div className="absolute right-4 top-4 text-blush-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-5 w-5 text-blush-400 z-10" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="sarah@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                          variant="customer"
                          required
                        />
                        {email && isFieldValid('email', email) && (
                          <div className="absolute right-4 top-4 text-blush-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Location Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-blush-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Phone className="h-5 w-5 text-blush-600" />
                      Contact & Location
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phone */}
                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone Number (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-4 h-5 w-5 text-blush-400 z-10" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="07123 456789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                          variant="customer"
                        />
                        {phone && isFieldValid('phone', phone) && (
                          <div className="absolute right-4 top-4 text-blush-600">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">For booking confirmations and updates</p>
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blush-600" />
                        Your Location
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
                        placeholder="Enter your postcode (e.g. SW1A 1AA)"
                        className="h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                        showCoverageRadius={false}
                        variant="customer"
                      />
                      {postcode && isFieldValid('postcode', postcode) && (
                        <div className="absolute right-4 top-4 text-blush-600">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">We'll show you available beauty services in your area</p>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="space-y-6">
                  <div className="pb-3 border-b border-blush-100">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blush-600" />
                      Account Security
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Password */}
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-blush-400 z-10" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                          variant="customer"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-blush-400 hover:text-blush-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                        {password && isFieldValid('password', password) && (
                          <div className="absolute right-12 top-4 text-blush-600">
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
                                className={`h-2 flex-1 rounded ${
                                  i < getPasswordStrength() ? 'bg-blush-600' : 'bg-muted'
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
                        <Lock className="absolute left-4 top-4 h-5 w-5 text-blush-400 z-10" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl border-blush-200 focus:border-blush-500 focus:ring-blush-200 text-base"
                          variant="customer"
                          required
                        />
                        {confirmPassword && isFieldValid('confirmPassword', confirmPassword) && (
                          <div className="absolute right-4 top-4 text-blush-600">
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
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-blush-600 to-blush-700 hover:from-blush-700 hover:to-blush-800 text-white font-semibold text-lg shadow-elegant hover:shadow-lg transition-all duration-300"
                  >
                    {loading ? "Creating Account..." : "Create Customer Account"}
                  </Button>
                </div>

                {/* Links */}
                <div className="text-center space-y-3 pt-4 border-t border-blush-100">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/auth" className="text-blush-600 hover:text-blush-700 font-medium hover:underline">
                      Sign in here
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Want to join as a business?{' '}
                    <Link to="/signup/business" className="text-accent hover:text-accent/80 font-medium hover:underline">
                      Create business account
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;