-- Fix security issues with the verification function
CREATE OR REPLACE FUNCTION public.update_verification_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if all verification criteria are met
  NEW.is_fully_verified = (
    NEW.identity_verified = true AND
    NEW.address_verified = true AND
    NEW.insurance_verified = true AND
    NEW.background_check_verified = true
  );
  
  -- Set completion timestamp if newly verified
  IF NEW.is_fully_verified = true AND OLD.is_fully_verified = false THEN
    NEW.verification_completed_at = now();
  END IF;
  
  -- Clear completion timestamp if verification is lost
  IF NEW.is_fully_verified = false AND OLD.is_fully_verified = true THEN
    NEW.verification_completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;