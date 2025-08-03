import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityValidator, useSecurityMonitoring } from '@/utils/securityEnhanced';
import { validatePassword, validateEmail } from '@/utils/validation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecureAuthFormProps {
  mode: 'signin' | 'signup';
  onSuccess: () => void;
}

export const SecureAuthForm: React.FC<SecureAuthFormProps> = ({ mode, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  
  const { logFailedLogin } = useSecurityMonitoring();

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup' && value) {
      const validation = validatePassword(value);
      setPasswordStrength(validation);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: string[] = [];

    // Rate limiting check
    const canAttempt = await SecurityValidator.checkRateLimit(
      mode === 'signin' ? 'login_attempt' : 'signup_attempt',
      SecurityValidator.sanitizeInput(email),
      5, // max 5 attempts
      15  // per 15 minutes
    );

    if (!canAttempt) {
      newErrors.push('Too many attempts. Please try again in 15 minutes.');
    }

    // Email validation
    const sanitizedEmail = SecurityValidator.sanitizeInput(email);
    if (!validateEmail(sanitizedEmail)) {
      newErrors.push('Please enter a valid email address');
    }

    // Password validation
    if (mode === 'signup') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        newErrors.push(...passwordValidation.errors);
      }

      if (password !== confirmPassword) {
        newErrors.push('Passwords do not match');
      }
    } else {
      if (!password) {
        newErrors.push('Password is required');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);
    setErrors([]);

    try {
      const sanitizedEmail = SecurityValidator.sanitizeInput(email);
      
      if (mode === 'signup') {
        const redirectUrl = `${window.location.origin}/auth`;
        const { error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              email_verified: false
            }
          }
        });

        if (error) {
          throw error;
        }

        // Log successful signup attempt
        await SecurityValidator.logSecurityEvent('signup_success', {
          email: sanitizedEmail
        });

        toast.success('Account created! Please check your email to verify your account.');
        onSuccess();
        
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password
        });

        if (error) {
          // Log failed login
          await logFailedLogin(sanitizedEmail, error.message);
          throw error;
        }

        // Log successful login
        await SecurityValidator.logSecurityEvent('login_success', {
          email: sanitizedEmail
        });

        toast.success('Welcome back!');
        onSuccess();
      }

    } catch (error: any) {
      console.error('Auth error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors([errorMessage]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score <= 2) return 'text-red-500';
    if (score <= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPasswordStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle className="text-2xl">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CardTitle>
        </div>
        <CardDescription>
          {mode === 'signin' 
            ? 'Enter your credentials to access your account'
            : 'Create a new account with enhanced security'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {mode === 'signup' && passwordStrength && (
              <div className="space-y-2">
                <div className={`text-sm ${getPasswordStrengthColor(passwordStrength.score)}`}>
                  Password Strength: {getPasswordStrengthText(passwordStrength.score)}
                </div>
                {passwordStrength.suggestions.length > 0 && (
                  <div className="text-xs text-gray-600">
                    {passwordStrength.suggestions[0]}
                  </div>
                )}
              </div>
            )}
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (mode === 'signup' && passwordStrength && !passwordStrength.isValid)}
          >
            {loading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        {mode === 'signup' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium">Security Features:</p>
                <ul className="mt-1 space-y-1">
                  <li>• Enhanced password validation</li>
                  <li>• Rate limiting protection</li>
                  <li>• Input sanitization</li>
                  <li>• Audit logging</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};