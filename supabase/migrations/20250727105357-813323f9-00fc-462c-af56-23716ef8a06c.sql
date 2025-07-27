-- Fix security issues by setting proper search paths for functions
-- Update calculate_distance function
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 numeric, 
  lon1 numeric, 
  lat2 numeric, 
  lon2 numeric
) RETURNS numeric 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Update find_providers_within_radius function
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
) 
LANGUAGE plpgsql 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;