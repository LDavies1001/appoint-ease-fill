-- Enhanced security fixes and improvements

-- 1. Create function to validate file uploads securely
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  bucket_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  max_file_size BIGINT;
  allowed_types TEXT[];
BEGIN
  -- Set file size limits per bucket
  CASE bucket_name
    WHEN 'profile-photos' THEN max_file_size := 5242880; -- 5MB
    WHEN 'business-photos' THEN max_file_size := 10485760; -- 10MB
    WHEN 'portfolio' THEN max_file_size := 15728640; -- 15MB
    WHEN 'certifications' THEN max_file_size := 10485760; -- 10MB
    ELSE max_file_size := 5242880; -- Default 5MB
  END CASE;

  -- Check file size
  IF file_size > max_file_size THEN
    RETURN FALSE;
  END IF;

  -- Set allowed MIME types per bucket
  CASE bucket_name
    WHEN 'profile-photos' THEN 
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp'];
    WHEN 'business-photos' THEN 
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp'];
    WHEN 'portfolio' THEN 
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp'];
    WHEN 'certifications' THEN 
      allowed_types := ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    ELSE 
      allowed_types := ARRAY['image/jpeg', 'image/png'];
  END CASE;

  -- Check MIME type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    RETURN FALSE;
  END IF;

  -- Check file extension matches MIME type
  IF NOT (
    (mime_type = 'image/jpeg' AND (file_name ILIKE '%.jpg' OR file_name ILIKE '%.jpeg')) OR
    (mime_type = 'image/png' AND file_name ILIKE '%.png') OR
    (mime_type = 'image/webp' AND file_name ILIKE '%.webp') OR
    (mime_type = 'application/pdf' AND file_name ILIKE '%.pdf')
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 2. Create audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_details JSONB NOT NULL DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.security_audit_log
FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON public.security_audit_log
FOR SELECT USING (auth.uid() = user_id);

-- 3. Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or user_id
  action_type TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(identifier, action_type)
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage rate limits
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');

-- 4. Create function to check rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_attempts INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up expired entries
  DELETE FROM public.rate_limits 
  WHERE expires_at < now();

  -- Get current attempts for this identifier and action
  SELECT attempts, window_start INTO current_attempts, window_start
  FROM public.rate_limits
  WHERE identifier = p_identifier 
    AND action_type = p_action_type
    AND expires_at > now();

  -- If no record exists, create one
  IF current_attempts IS NULL THEN
    INSERT INTO public.rate_limits (identifier, action_type, attempts, window_start, expires_at)
    VALUES (p_identifier, p_action_type, 1, now(), now() + INTERVAL '1 minute' * p_window_minutes)
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET 
      attempts = 1,
      window_start = now(),
      expires_at = now() + INTERVAL '1 minute' * p_window_minutes;
    RETURN TRUE;
  END IF;

  -- If within rate limit, increment counter
  IF current_attempts < p_max_attempts THEN
    UPDATE public.rate_limits 
    SET attempts = attempts + 1
    WHERE identifier = p_identifier AND action_type = p_action_type;
    RETURN TRUE;
  END IF;

  -- Rate limit exceeded
  RETURN FALSE;
END;
$$;

-- 5. Enhanced storage policies with validation
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Secure file upload policies
CREATE POLICY "Secure file uploads" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  bucket_id IN ('profile-photos', 'business-photos', 'portfolio', 'certifications') AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  public.validate_file_upload(name, metadata->>'size'::text::bigint, metadata->>'mimetype', bucket_id)
);

CREATE POLICY "Secure file updates" ON storage.objects
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  bucket_id IN ('profile-photos', 'business-photos', 'portfolio', 'certifications') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Secure file access" ON storage.objects
FOR SELECT USING (
  bucket_id IN ('profile-photos', 'business-photos', 'portfolio', 'certifications') AND
  (
    bucket_id IN ('profile-photos', 'business-photos', 'portfolio') OR
    (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1])
  )
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits(expires_at);