-- Add radius and nearby towns columns to provider_details table
ALTER TABLE provider_details 
ADD COLUMN service_radius_miles INTEGER,
ADD COLUMN nearby_towns TEXT[];

-- Add comment for clarity
COMMENT ON COLUMN provider_details.service_radius_miles IS 'Service radius in miles around business postcode';
COMMENT ON COLUMN provider_details.nearby_towns IS 'Array of towns/areas within the service radius';