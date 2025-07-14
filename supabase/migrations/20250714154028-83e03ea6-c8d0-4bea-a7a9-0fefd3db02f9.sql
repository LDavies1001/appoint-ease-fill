-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN privacy_settings JSONB DEFAULT '{
  "phone_visible": true,
  "email_visible": false,
  "location_visible": true
}'::jsonb;

-- Add GDPR consent and terms acceptance tracking
ALTER TABLE public.profiles
ADD COLUMN gdpr_consent BOOLEAN DEFAULT false,
ADD COLUMN terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN name TEXT; -- Add name field as required

-- Update trigger to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, name)
  VALUES (
    new.id, 
    new.email, 
    'customer',
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$$;