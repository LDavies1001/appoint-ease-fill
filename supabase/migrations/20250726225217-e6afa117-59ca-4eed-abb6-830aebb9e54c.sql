-- Make service_id nullable in bookings table since slots reference provider_services
ALTER TABLE public.bookings ALTER COLUMN service_id DROP NOT NULL;