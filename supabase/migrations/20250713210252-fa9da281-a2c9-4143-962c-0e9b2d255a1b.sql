-- Update the user's role from customer to provider
UPDATE profiles 
SET role = 'provider' 
WHERE user_id = 'ffba4d4f-53d2-43bd-b357-796d27127eab';