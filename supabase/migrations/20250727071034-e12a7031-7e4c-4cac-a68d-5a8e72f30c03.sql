-- Fix critical security vulnerabilities

-- 1. Fix User Role Privilege Escalation - Prevent direct role updates
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Only allow role activation/deactivation, not role type changes
CREATE POLICY "Users can only activate/deactivate their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = role);

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