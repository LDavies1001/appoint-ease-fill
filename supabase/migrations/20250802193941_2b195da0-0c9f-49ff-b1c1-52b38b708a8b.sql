-- Clear the incorrect services for the user so they can start fresh
UPDATE provider_details 
SET services_offered = ARRAY[]::text[]
WHERE user_id = '2a31744a-8fae-4fde-b01f-5c475082940f';