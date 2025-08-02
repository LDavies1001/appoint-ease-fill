-- Add a new column for structured services data
ALTER TABLE provider_details 
ADD COLUMN services_selection JSONB DEFAULT '{}';

-- Add comment explaining the difference
COMMENT ON COLUMN provider_details.services_offered IS 'Legacy: Array of category names';
COMMENT ON COLUMN provider_details.services_selection IS 'New: Structured data with categories and specific services selected';