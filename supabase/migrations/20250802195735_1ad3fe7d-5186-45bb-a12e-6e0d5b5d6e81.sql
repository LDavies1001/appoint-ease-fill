-- Add image_url column to provider_services table
ALTER TABLE public.provider_services 
ADD COLUMN image_url TEXT;