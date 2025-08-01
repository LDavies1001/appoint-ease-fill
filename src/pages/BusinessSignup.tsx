import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, User, MapPin, Check, ArrowLeft } from 'lucide-react';
import { LocationInput } from '@/components/ui/location-input';


const BusinessSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
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

    if (!location.trim()) {
      toast({
        title: "Location required",
        description: "Please enter your business location",
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
      const { error } = await signUp(email, password, 'provider', fullName, phone, location, businessName);
      
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
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-provider to-provider-glow rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-foreground">Open-Slot</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Business Account Created!
              </h1>
              <p className="text-muted-foreground">
                Please check your email for verification before logging in
              </p>
            </div>

            <Card className="border-0 shadow-elegant bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-provider/10">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-provider/10 border border-provider/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-provider" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Check Your Email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a verification email to <strong className="text-provider">{email}</strong>. 
                  Please click the link in the email to verify your account before logging in.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  variant="provider-hero"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-provider/5 via-background to-provider/10 overflow-x-hidden w-full">
      
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-7xl animate-fade-in">
          {/* Two-column layout on desktop, single column on mobile */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left column - Inspirational content (hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center space-y-8 pl-8">
              <div className="space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-provider to-provider-glow rounded-2xl flex items-center justify-center">
                  <Building className="h-8 w-8 text-white" />
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold text-foreground leading-tight">
                    Turn empty appointment slots into revenue
                  </h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Connect with local customers who are looking for last-minute bookings. 
                    Fill your cancellations and grow your business effortlessly.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Instant bookings</p>
                      <p className="text-sm text-muted-foreground">Get notified immediately when customers book</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Zero commission</p>
                      <p className="text-sm text-muted-foreground">Keep 100% of your earnings</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Local customers</p>
                      <p className="text-sm text-muted-foreground">Connect with customers in your area</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right column - Form */}
            <div className="w-full max-w-lg mx-auto lg:mx-0">

              {/* Main heading */}
              <div className="text-center lg:text-left mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Grow Your Business, One Booking at a Time
                </h1>
                <p className="text-muted-foreground text-lg">
                  Join the OpenSlot community and start filling your empty slots with local customers who are ready to book.
                </p>
              </div>

              {/* Form Card */}
              <Card className="border-0 shadow-elegant bg-card/80 backdrop-blur-sm p-8 rounded-2xl border border-provider/10">
                <div className="mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                  </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-sm font-medium">Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="business-name"
                        type="text"
                        placeholder="Enter your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      {businessName && isFieldValid('businessName', businessName) && (
                        <div className="absolute right-3 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full-name" className="text-sm font-medium">Your Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="full-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      {fullName && isFieldValid('fullName', fullName) && (
                        <div className="absolute right-3 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="business-email" className="text-sm font-medium">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="business-email"
                        type="email"
                        placeholder="Enter your business email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      {email && isFieldValid('email', email) && (
                        <div className="absolute right-3 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Business Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07123456789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      {phone && isFieldValid('phone', phone) && (
                        <div className="absolute right-3 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Customers will use this to contact you</p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="business-location" className="text-sm font-medium">Business Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <LocationInput
                        placeholder="Enter your business postcode"
                        value={location}
                        onChange={setLocation}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                      />
                      {location && isFieldValid('location', location) && (
                        <div className="absolute right-3 top-3 text-green-600 z-20">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Enter your postcode so customers can find you</p>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-12 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors z-20"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {password && isFieldValid('password', password) && (
                        <div className="absolute right-10 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {password && (
                      <div className="space-y-2">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                               className={`h-1.5 flex-1 rounded-full transition-colors ${
                                 i < getPasswordStrength() ? 'bg-gradient-to-r from-accent to-accent-glow' : 'bg-muted'
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
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 rounded-xl border-provider/20 focus:border-provider focus:ring-provider/20"
                        required
                      />
                      {confirmPassword && isFieldValid('confirmPassword', confirmPassword) && (
                        <div className="absolute right-3 top-3 text-green-600">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    variant="provider-hero"
                    size="lg"
                    className="w-full mt-8 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? "Creating Your Free Business Account..." : "Create My Free Business Account"}
                  </Button>

                  {/* Footer Links */}
                  <div className="text-center space-y-3 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{' '}
                      <Link to="/auth" className="text-provider hover:underline font-medium">
                        Sign in here
                      </Link>
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Want to join as a customer?{' '}
                    <Link to="/signup/customer" className="text-provider hover:underline font-medium">
                      Create customer account
                    </Link>
                    </p>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSignup;