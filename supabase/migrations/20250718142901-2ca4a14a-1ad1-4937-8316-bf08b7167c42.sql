-- Update existing user's profile with data from user metadata
UPDATE public.profiles 
SET 
  name = (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profiles.user_id),
  phone = (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = profiles.user_id),
  location = (SELECT raw_user_meta_data->>'location' FROM auth.users WHERE id = profiles.user_id)
WHERE user_id = '1673a2da-756b-4279-89a2-9a199729f3c0';