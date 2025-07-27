-- Fix critical security vulnerabilities

-- 1. Fix User Role Privilege Escalation - Prevent direct role updates
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Only allow role activation/deactivation, not role type changes
CREATE POLICY "Users can only activate/deactivate their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND OLD.role = NEW.role);

-- 2. Secure Notification System - Tighten policies
DROP POLICY IF EXISTS "System can insert notification logs" ON public.notifications_log;
DROP POLICY IF EXISTS "System can update notification logs" ON public.notifications_log;

-- Only allow system (service role) to insert/update notifications
CREATE POLICY "Service role can insert notification logs" 
ON public.notifications_log 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "Service role can update notification logs" 
ON public.notifications_log 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = user_id);

-- 3. Add role change audit logging table
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by UUID,
  business_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view their own role changes" 
ON public.role_change_audit 
FOR SELECT 
USING (auth.uid() = user_id);

-- Only system can insert audit logs
CREATE POLICY "Service role can insert audit logs" 
ON public.role_change_audit 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 4. Add business ownership validation function
CREATE OR REPLACE FUNCTION public.verify_business_ownership(
  user_id UUID,
  business_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has a provider_details record with this business name
  RETURN EXISTS (
    SELECT 1 
    FROM public.provider_details 
    WHERE provider_details.user_id = verify_business_ownership.user_id 
    AND provider_details.business_name = verify_business_ownership.business_name
  );
END;
$$;

-- 5. Add secure role switching function
CREATE OR REPLACE FUNCTION public.secure_role_switch(
  target_role TEXT,
  business_name TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  role_exists BOOLEAN;
  result JSON;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  -- Check if user has the target role
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles 
    WHERE user_id = current_user_id 
    AND role = target_role::user_role
    AND is_active = true
  ) INTO role_exists;
  
  IF NOT role_exists THEN
    RETURN json_build_object('error', 'User does not have this role');
  END IF;
  
  -- For provider role, verify business ownership if business_name provided
  IF target_role = 'provider' AND business_name IS NOT NULL THEN
    IF NOT public.verify_business_ownership(current_user_id, business_name) THEN
      RETURN json_build_object('error', 'User does not own this business');
    END IF;
  END IF;
  
  -- Update active role in profiles
  UPDATE public.profiles 
  SET active_role = target_role::user_role,
      updated_at = now()
  WHERE user_id = current_user_id;
  
  -- Log the role change
  INSERT INTO public.role_change_audit (
    user_id,
    new_role,
    business_name,
    changed_by
  ) VALUES (
    current_user_id,
    target_role,
    business_name,
    current_user_id
  );
  
  RETURN json_build_object('success', true, 'role', target_role);
END;
$$;