-- Add new structured address fields to provider_details table
ALTER TABLE provider_details 
ADD COLUMN business_street TEXT,
ADD COLUMN business_city TEXT,
ADD COLUMN business_county TEXT,
ADD COLUMN business_postcode TEXT,
ADD COLUMN business_country TEXT;