-- Update provider_details table to use new postcode structure
-- Add new columns
ALTER TABLE public.provider_details 
ADD COLUMN IF NOT EXISTS postcode_full TEXT,
ADD COLUMN IF NOT EXISTS postcode_area TEXT,
ADD COLUMN IF NOT EXISTS coverage_towns TEXT[];

-- Migrate existing data where possible
UPDATE public.provider_details 
SET 
  postcode_full = CASE 
    WHEN postcode_admin_district IS NOT NULL 
    THEN COALESCE(postcode_admin_district, '') || ' ' || COALESCE(postcode_admin_ward, '')
    ELSE NULL
  END,
  coverage_towns = CASE 
    WHEN nearby_towns IS NOT NULL 
    THEN nearby_towns
    ELSE ARRAY[]::TEXT[]
  END
WHERE postcode_full IS NULL;

-- Remove old columns that are no longer needed
ALTER TABLE public.provider_details 
DROP COLUMN IF EXISTS postcode_latitude,
DROP COLUMN IF EXISTS postcode_longitude,
DROP COLUMN IF EXISTS postcode_admin_district,
DROP COLUMN IF EXISTS postcode_admin_ward,
DROP COLUMN IF EXISTS service_radius_miles,
DROP COLUMN IF EXISTS nearby_towns;