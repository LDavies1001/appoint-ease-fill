-- Simplify address structure in provider_details
-- Remove redundant address fields and keep only essential ones
ALTER TABLE provider_details 
DROP COLUMN IF EXISTS business_street,
DROP COLUMN IF EXISTS business_city,
DROP COLUMN IF EXISTS business_county,
DROP COLUMN IF EXISTS business_country,
DROP COLUMN IF EXISTS business_address,
DROP COLUMN IF EXISTS service_area,
DROP COLUMN IF EXISTS coverage_towns;

-- Keep and enhance the essential fields
ALTER TABLE provider_details 
ALTER COLUMN business_postcode TYPE text,
ALTER COLUMN postcode_area TYPE text,
ALTER COLUMN postcode_full TYPE text;

-- Add new simplified fields
ALTER TABLE provider_details 
ADD COLUMN IF NOT EXISTS formatted_address text,
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8),
ADD COLUMN IF NOT EXISTS service_radius_miles integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS coverage_areas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS postcode_data jsonb DEFAULT '{}'::jsonb;

-- Create index for geographic queries
CREATE INDEX IF NOT EXISTS idx_provider_details_location ON provider_details USING btree (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_provider_details_postcode ON provider_details USING btree (business_postcode);

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric, 
  lon1 numeric, 
  lat2 numeric, 
  lon2 numeric
) RETURNS numeric AS $$
DECLARE
  earth_radius numeric := 3959; -- Earth radius in miles
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to find providers within radius
CREATE OR REPLACE FUNCTION public.find_providers_within_radius(
  search_lat numeric,
  search_lon numeric,
  radius_miles numeric DEFAULT 10
) RETURNS TABLE (
  provider_id uuid,
  business_name text,
  business_postcode text,
  distance_miles numeric,
  latitude numeric,
  longitude numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.user_id,
    pd.business_name,
    pd.business_postcode,
    public.calculate_distance(search_lat, search_lon, pd.latitude, pd.longitude) as distance,
    pd.latitude,
    pd.longitude
  FROM provider_details pd
  WHERE pd.latitude IS NOT NULL 
    AND pd.longitude IS NOT NULL
    AND pd.profile_published = true
    AND public.calculate_distance(search_lat, search_lon, pd.latitude, pd.longitude) <= radius_miles
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql STABLE;