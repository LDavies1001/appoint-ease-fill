-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.verify_business_ownership(
  user_id UUID,
  business_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Fix secure role switching function search path
CREATE OR REPLACE FUNCTION public.secure_role_switch(
  target_role TEXT,
  business_name TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    AND role = target_role::public.user_role
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
  SET active_role = target_role::public.user_role,
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