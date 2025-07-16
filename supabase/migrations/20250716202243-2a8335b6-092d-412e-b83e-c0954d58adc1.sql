-- Update the current business user's role to provider
UPDATE profiles 
SET role = 'provider'
WHERE user_id = 'cb6454da-9ded-4526-b9e1-e185e51a586c';