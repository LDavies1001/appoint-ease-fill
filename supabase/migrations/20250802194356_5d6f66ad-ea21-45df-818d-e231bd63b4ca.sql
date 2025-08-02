-- Update the user's profile with the correct eyebrow and eyelash services they selected during registration
UPDATE provider_details 
SET services_offered = ARRAY[
  'Eyebrow Threading',
  'Eyebrow Tinting', 
  'Eyebrow Waxing',
  'Eyelash Extensions',
  'Eyelash Lift',
  'Eyelash Tinting',
  'Lashes'
]
WHERE user_id = '2a31744a-8fae-4fde-b01f-5c475082940f';