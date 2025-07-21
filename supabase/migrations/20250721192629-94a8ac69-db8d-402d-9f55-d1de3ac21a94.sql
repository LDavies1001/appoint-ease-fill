-- Add cover image URL field to provider_details table
ALTER TABLE provider_details 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;