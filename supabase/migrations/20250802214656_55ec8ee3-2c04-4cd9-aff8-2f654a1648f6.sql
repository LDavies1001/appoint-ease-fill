-- Update services_offered column to store JSONB data for better structure
ALTER TABLE provider_details 
ALTER COLUMN services_offered TYPE JSONB USING services_offered::jsonb;