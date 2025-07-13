-- Add new columns to availability_slots for discount pricing and image uploads
ALTER TABLE public.availability_slots 
ADD COLUMN discount_price numeric,
ADD COLUMN image_url text;