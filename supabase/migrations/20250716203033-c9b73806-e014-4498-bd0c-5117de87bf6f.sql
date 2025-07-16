-- Update the latest user's role to provider
UPDATE profiles 
SET role = 'provider'
WHERE user_id = '193e2450-74d3-4d42-832d-e39f4f80782e';