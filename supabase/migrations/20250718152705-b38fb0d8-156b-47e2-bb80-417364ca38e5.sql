-- Add social media links fields to provider_details
ALTER TABLE provider_details 
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- Update certifications to support file storage
ALTER TABLE provider_details 
ADD COLUMN IF NOT EXISTS certification_files TEXT[] DEFAULT ARRAY[]::TEXT[];