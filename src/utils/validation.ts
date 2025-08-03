// Enhanced input validation utilities for security
import { SecurityValidator } from './securityEnhanced';

export const sanitizeInput = (input: string): string => {
  return SecurityValidator.sanitizeInput(input);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // UK phone number validation
  const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(phone);
};

export const validateBusinessName = (name: string): boolean => {
  if (!name || name.length < 2 || name.length > 100) return false;
  
  // Allow letters, numbers, spaces, and common business punctuation
  const businessNameRegex = /^[a-zA-Z0-9\s\-&'.,()]+$/;
  return businessNameRegex.test(name);
};

export const validateUrl = (url: string): boolean => {
  return SecurityValidator.validateSecureUrl(url);
};

export const validatePostcode = (postcode: string): boolean => {
  // UK postcode validation
  const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode.replace(/\s/g, ''));
};

export const rateLimitCheck = (
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean => {
  const now = Date.now();
  const attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]') as number[];
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  // Add current attempt
  recentAttempts.push(now);
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
  
  return true; // Allow the action
};

export const validateTextLength = (text: string, minLength: number, maxLength: number): boolean => {
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
};

export const validatePassword = (password: string): {
  isValid: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
} => {
  return SecurityValidator.validatePassword(password);
};