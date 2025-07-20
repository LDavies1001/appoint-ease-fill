-- Add address privacy setting to provider_details table
ALTER TABLE public.provider_details 
ADD COLUMN is_address_public boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.provider_details.is_address_public IS 'Whether the business address should be visible to customers before booking';