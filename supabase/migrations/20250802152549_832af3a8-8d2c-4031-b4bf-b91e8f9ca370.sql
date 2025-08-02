-- Fix Laura's profile to be provider instead of customer
UPDATE public.profiles 
SET role = 'provider', active_role = 'provider'
WHERE user_id = '2a31744a-8fae-4fde-b01f-5c475082940f';

-- Update the user_roles table as well
UPDATE public.user_roles 
SET role = 'provider'
WHERE user_id = '2a31744a-8fae-4fde-b01f-5c475082940f';

-- Also add the provider role if not exists (in case we need both)
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('2a31744a-8fae-4fde-b01f-5c475082940f', 'provider', true)
ON CONFLICT (user_id, role) DO NOTHING;