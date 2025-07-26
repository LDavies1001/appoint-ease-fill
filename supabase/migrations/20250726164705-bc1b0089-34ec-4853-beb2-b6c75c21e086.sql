-- Add new columns for awards, memberships, and other qualifications to provider_details table
ALTER TABLE public.provider_details 
ADD COLUMN IF NOT EXISTS awards_recognitions TEXT,
ADD COLUMN IF NOT EXISTS professional_memberships TEXT,
ADD COLUMN IF NOT EXISTS other_qualifications TEXT;