// Conversion-focused Customer Signup page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Phone, Heart, ArrowLeft, Star, Clock, Zap, MapPin, PoundSterling, Shield } from 'lucide-react';
import { LocationInput } from '@/components/ui/location-input';

import { sanitizeInput, validateEmail, validatePhone, validatePassword, rateLimitCheck } from '@/utils/validation';

const CustomerSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

  const getPasswordStrength = () => {
    const validation = validatePassword(password);
    return validation.score;
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
        sanitizedLocation
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
                Welcome to the Future!
              </h1>
              <p className="text-muted-foreground font-medium">
                Check your email to verify your account and start booking amazing deals
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-rose-50/30 animate-fade-in">
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
              <img 
                src="/lovable-uploads/25374dab-f21c-463e-9a1b-4ed306a48b44.png" 
                alt="OpenSlot Logo" 
                className="w-7 h-7 md:w-8 md:h-8 object-contain"
              />
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
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                />
                <p className="text-xs text-muted-foreground">We'll use this to send booking confirmations</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold text-foreground">Location (Optional)</Label>
                <LocationInput
                  placeholder="Enter your postcode"
                  value={location}
                  onChange={setLocation}
                  className="h-11 rounded-lg border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                />
                <p className="text-xs text-muted-foreground">Help us find services near you</p>
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
            <p className="text-sm text-muted-foreground mt-2">
              Want to join as a business?{' '}
              <Link to="/signup/business" className="text-rose-600 hover:underline">
                Business signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup;