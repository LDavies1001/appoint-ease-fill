-- Create the user_role enum type that's missing
CREATE TYPE public.user_role AS ENUM ('customer', 'provider', 'admin');

-- Update the profiles table to use the enum properly
ALTER TABLE public.profiles ALTER COLUMN role TYPE user_role USING role::user_role;