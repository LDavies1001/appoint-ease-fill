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
ADD COLUMN consent_date TIMESTAMP WITH TIME ZONE;