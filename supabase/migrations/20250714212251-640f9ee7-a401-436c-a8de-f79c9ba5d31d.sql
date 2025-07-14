-- Fix the existing user's role to provider
UPDATE profiles 
SET role = 'provider'::user_role, 
    name = 'Laura Davies'
WHERE user_id = '2d725045-b110-4512-8523-17edf2e61643';