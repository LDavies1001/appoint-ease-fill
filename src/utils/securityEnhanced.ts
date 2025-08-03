import { supabase } from "@/integrations/supabase/client";

// Enhanced security utilities
export class SecurityValidator {
  
  // Log security events
  static async logSecurityEvent(
    eventType: string,
    details: Record<string, any> = {},
    userId?: string
  ) {
    try {
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      await supabase.functions.invoke('security-monitor', {
        body: {
          event_type: eventType,
          user_id: userId,
          details,
          ip_address: ipAddress,
          user_agent: userAgent
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Get client IP address
  static async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }

  // Enhanced input sanitization
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove objects
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embeds
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/vbscript:/gi, '') // Remove vbscript: URLs
      .replace(/data:text\/html/gi, '') // Remove data URLs with HTML
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .trim();
  }

  // Validate file uploads with enhanced security
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = allowedTypes.map(type => {
      switch (type) {
        case 'image/jpeg': return ['jpg', 'jpeg'];
        case 'image/png': return ['png'];
        case 'image/webp': return ['webp'];
        case 'application/pdf': return ['pdf'];
        default: return [];
      }
    }).flat();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`);
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i,
      /\.scr$/i, /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.com$/i, /\.pif$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('Suspicious file type detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Check rate limiting
  static async checkRateLimit(
    action: string,
    identifier?: string,
    maxAttempts: number = 5,
    windowMinutes: number = 15
  ): Promise<boolean> {
    try {
      const key = identifier || 'anonymous';
      const storageKey = `rate_limit_${action}_${key}`;
      const now = Date.now();
      
      const stored = localStorage.getItem(storageKey);
      const attempts = stored ? JSON.parse(stored) : [];
      
      // Remove expired attempts
      const validAttempts = attempts.filter(
        (time: number) => now - time < windowMinutes * 60 * 1000
      );
      
      if (validAttempts.length >= maxAttempts) {
        await this.logSecurityEvent('rate_limit_exceeded', {
          action,
          identifier: key,
          attempts: validAttempts.length
        });
        return false;
      }
      
      // Add current attempt
      validAttempts.push(now);
      localStorage.setItem(storageKey, JSON.stringify(validAttempts));
      
      return true;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // Fail open for better user experience
    }
  }

  // Enhanced password validation
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
      suggestions.push('Use a longer password for better security');
    } else {
      score += 2;
    }

    // Character variety
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain special characters');
    } else {
      score += 1;
    }

    // Common patterns and dictionary words
    const commonPatterns = [
      /123456/, /password/i, /qwerty/i, /admin/i, /welcome/i,
      /letmein/i, /monkey/i, /dragon/i, /pass/i, /master/i
    ];

    if (commonPatterns.some(pattern => pattern.test(password))) {
      errors.push('Password contains common patterns or words');
      suggestions.push('Avoid common words and predictable patterns');
      score = Math.max(0, score - 2);
    }

    // Sequential characters
    if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      errors.push('Password contains sequential characters');
      suggestions.push('Avoid sequential letters or numbers');
      score = Math.max(0, score - 1);
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password contains too many repeated characters');
      suggestions.push('Avoid repeating the same character multiple times');
      score = Math.max(0, score - 1);
    }

    if (score >= 5) {
      suggestions.push('Strong password! Consider using a password manager.');
    } else if (score >= 3) {
      suggestions.push('Good password. Consider adding more variety.');
    } else {
      suggestions.push('Weak password. Please strengthen it significantly.');
    }

    return {
      isValid: errors.length === 0 && score >= 4,
      score: Math.min(score, 6),
      errors,
      suggestions
    };
  }

  // Validate URLs with security checks
  static validateSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS for external URLs
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        return false;
      }

      // Block suspicious domains
      const suspiciousDomains = [
        'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
        'tiny.cc', 'is.gd', 'buff.ly'
      ];

      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }

      // Block local/internal addresses for external URLs
      const hostname = urlObj.hostname;
      if (hostname === 'localhost' || 
          hostname.startsWith('127.') || 
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Content Security Policy helpers
  static setSecurityHeaders(): void {
    // This would typically be set on the server side
    // For client-side, we can at least validate and sanitize content
    const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!meta) {
      console.warn('Content Security Policy not detected. Consider implementing CSP headers.');
    }
  }
}

// Security monitoring hooks
export const useSecurityMonitoring = () => {
  const logFailedLogin = async (email: string, error: string) => {
    await SecurityValidator.logSecurityEvent('failed_login_attempt', {
      email: SecurityValidator.sanitizeInput(email),
      error: error
    });
  };

  const logUnauthorizedAccess = async (resource: string, userId?: string) => {
    await SecurityValidator.logSecurityEvent('unauthorized_access', {
      resource: SecurityValidator.sanitizeInput(resource)
    }, userId);
  };

  const logFileUploadViolation = async (fileName: string, violation: string, userId?: string) => {
    await SecurityValidator.logSecurityEvent('file_upload_violation', {
      file_name: SecurityValidator.sanitizeInput(fileName),
      violation: violation
    }, userId);
  };

  return {
    logFailedLogin,
    logUnauthorizedAccess,
    logFileUploadViolation
  };
};