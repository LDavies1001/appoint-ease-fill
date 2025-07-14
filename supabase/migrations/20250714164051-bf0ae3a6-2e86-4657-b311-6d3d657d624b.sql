-- Add foreign key constraints that are missing
ALTER TABLE public.customer_favourites 
ADD CONSTRAINT customer_favourites_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.customer_favourites 
ADD CONSTRAINT customer_favourites_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.local_offers 
ADD CONSTRAINT local_offers_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES profiles(user_id) ON DELETE CASCADE;