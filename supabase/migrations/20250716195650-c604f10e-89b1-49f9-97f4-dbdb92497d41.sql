-- Manually create missing profile for the existing user
INSERT INTO public.profiles (user_id, email, role, is_profile_complete)
VALUES (
  '23381563-695c-47dc-b255-08dfd7956030',
  'test@example.com',
  'customer',
  false
)
ON CONFLICT (user_id) DO NOTHING;