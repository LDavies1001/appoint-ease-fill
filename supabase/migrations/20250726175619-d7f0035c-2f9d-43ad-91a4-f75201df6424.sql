-- Add business verification tracking fields
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS identity_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS identity_documents JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS address_verified BOOLEAN DEFAULT false;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS address_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS address_verification_method TEXT;

ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS insurance_verified BOOLEAN DEFAULT false;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS insurance_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS insurance_documents JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS background_check_verified BOOLEAN DEFAULT false;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS background_check_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS background_check_documents JSONB DEFAULT '[]'::jsonb;

-- Add overall verification status
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS is_fully_verified BOOLEAN DEFAULT false;
ALTER TABLE public.provider_details ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically update overall verification status
CREATE OR REPLACE FUNCTION public.update_verification_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update verification status
DROP TRIGGER IF EXISTS trigger_update_verification_status ON public.provider_details;
CREATE TRIGGER trigger_update_verification_status
  BEFORE UPDATE ON public.provider_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_verification_status();