-- Migrate existing pricing info from provider_details to provider_services for user Laura Davies
INSERT INTO provider_services (provider_id, service_name, base_price, duration_minutes, is_active)
VALUES 
  ('2d725045-b110-4512-8523-17edf2e61643', 'Eyelash Extensions', 50.00, 60, true),
  ('2d725045-b110-4512-8523-17edf2e61643', 'Eyelash Lift', 20.00, 45, true),
  ('2d725045-b110-4512-8523-17edf2e61643', 'Eyebrow Wax', 10.00, 30, true),
  ('2d725045-b110-4512-8523-17edf2e61643', 'Eyebrow Wax and Tint', 15.00, 45, true)
ON CONFLICT (provider_id, service_name) DO UPDATE SET
  base_price = EXCLUDED.base_price,
  duration_minutes = EXCLUDED.duration_minutes,
  is_active = EXCLUDED.is_active;