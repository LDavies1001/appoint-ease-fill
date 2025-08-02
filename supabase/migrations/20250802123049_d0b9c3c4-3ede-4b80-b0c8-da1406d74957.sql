-- Remove test/example reviews from the platform_reviews table
DELETE FROM public.platform_reviews 
WHERE email IN (
    'sarah@example.com',
    'emily@example.com', 
    'jessica@example.com',
    'TEST@TEST.COM'
) OR name IN (
    'Sarah Johnson',
    'Emily Rose',
    'Jessica Martinez',
    'TEST'
);