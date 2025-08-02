-- Create the missing profile for the user
INSERT INTO public.profiles (user_id, email, role, active_role, name, phone, location, is_profile_complete)
VALUES (
  '2a31744a-8fae-4fde-b01f-5c475082940f',
  'laura.davies@cognisoft.co.uk',
  'customer',
  'customer',
  'Laura Davies',
  NULL,
  NULL,
  false
);

-- Also create the user_roles entry
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES (
  '2a31744a-8fae-4fde-b01f-5c475082940f',
  'customer',
  true
);

-- Check if the handle_new_user trigger exists and recreate it to ensure it works
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();