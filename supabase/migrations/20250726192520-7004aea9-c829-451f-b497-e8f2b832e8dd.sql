-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS public.handle_booking_notifications() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_booking_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status changes or new bookings
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- Log the notification requirement
    INSERT INTO public.notifications_log (
      user_id,
      notification_type,
      channel,
      content,
      booking_id
    ) VALUES 
    -- Notify customer
    (NEW.customer_id, 
     CASE 
       WHEN TG_OP = 'INSERT' THEN 'booking_confirmation'
       WHEN NEW.status = 'confirmed' THEN 'booking_confirmed'
       WHEN NEW.status = 'cancelled' THEN 'booking_cancelled'
       WHEN NEW.status = 'completed' THEN 'booking_completed'
       ELSE 'booking_status_change'
     END,
     'email',
     jsonb_build_object(
       'booking_id', NEW.id,
       'booking_date', NEW.booking_date,
       'start_time', NEW.start_time,
       'end_time', NEW.end_time,
       'status', NEW.status,
       'price', NEW.price
     ),
     NEW.id),
    -- Notify provider  
    (NEW.provider_id,
     CASE 
       WHEN TG_OP = 'INSERT' THEN 'new_booking_received'
       WHEN NEW.status = 'cancelled' THEN 'booking_cancelled_provider'
       ELSE 'booking_status_change_provider'
     END,
     'email',
     jsonb_build_object(
       'booking_id', NEW.id,
       'booking_date', NEW.booking_date,
       'start_time', NEW.start_time,
       'end_time', NEW.end_time,
       'status', NEW.status,
       'price', NEW.price
     ),
     NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Recreate trigger
CREATE TRIGGER trigger_booking_notifications
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_notifications();

-- Fix other functions with search_path
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, active_role, name, phone, location)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'customer')::public.user_role,
    COALESCE(new.raw_user_meta_data->>'role', 'customer')::public.user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', null),
    COALESCE(new.raw_user_meta_data->>'phone', null),
    COALESCE(new.raw_user_meta_data->>'location', null)
  );
  
  -- Also create the user_roles entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'customer')::public.user_role
  );
  
  RETURN new;
END;
$$;

-- Update update_verification_status function
DROP FUNCTION IF EXISTS public.update_verification_status() CASCADE;
CREATE OR REPLACE FUNCTION public.update_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Check if all verification criteria are met
  NEW.is_fully_verified = (
    NEW.identity_verified = true AND
    NEW.address_verified = true AND
    NEW.insurance_verified = true AND
    NEW.background_check_verified = true
  );
  
  -- Set completion timestamp if newly verified
  IF NEW.is_fully_verified = true AND OLD.is_fully_verified = false THEN
    NEW.verification_completed_at = now();
  END IF;
  
  -- Clear completion timestamp if verification is lost
  IF NEW.is_fully_verified = false AND OLD.is_fully_verified = true THEN
    NEW.verification_completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update handle_portfolio_slug function
DROP FUNCTION IF EXISTS public.handle_portfolio_slug() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_portfolio_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Generate slug when making public and slug doesn't exist
  IF NEW.is_public = true AND (OLD.public_slug IS NULL OR OLD.is_public = false) THEN
    NEW.public_slug := public.generate_portfolio_slug(NEW.title, NEW.provider_id);
  END IF;
  
  -- Clear slug when making private
  IF NEW.is_public = false THEN
    NEW.public_slug := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;