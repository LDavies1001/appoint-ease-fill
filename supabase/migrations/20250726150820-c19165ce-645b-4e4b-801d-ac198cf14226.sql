-- Add discount_price field to provider_services table
ALTER TABLE provider_services 
ADD COLUMN IF NOT EXISTS discount_price NUMERIC;