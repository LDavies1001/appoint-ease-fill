-- Add location metadata columns to provider_details table for postcode lookup functionality
ALTER TABLE public.provider_details 
ADD COLUMN IF NOT EXISTS postcode_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS postcode_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS postcode_admin_district TEXT,
ADD COLUMN IF NOT EXISTS postcode_admin_ward TEXT,
ADD COLUMN IF NOT EXISTS postcode_verified_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.provider_details.postcode_latitude IS 'Latitude from verified postcode lookup';
COMMENT ON COLUMN public.provider_details.postcode_longitude IS 'Longitude from verified postcode lookup';
COMMENT ON COLUMN public.provider_details.postcode_admin_district IS 'Administrative district from postcode lookup';
COMMENT ON COLUMN public.provider_details.postcode_admin_ward IS 'Administrative ward from postcode lookup';
COMMENT ON COLUMN public.provider_details.postcode_verified_at IS 'When the postcode was last verified via API lookup';