-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{
  "email_notifications": true,
  "sms_notifications": false,
  "booking_reminders": true,
  "marketing_communications": false,
  "booking_confirmations": true,
  "cancellation_notifications": true,
  "profile_update_notifications": true
}'::jsonb;

-- Create notifications log table to track sent notifications
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  channel text NOT NULL, -- 'email', 'sms', 'toast'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  content jsonb NOT NULL,
  booking_id uuid,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on notifications_log
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view their own notification logs"
ON public.notifications_log
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert notification logs (for edge functions)
CREATE POLICY "System can insert notification logs"
ON public.notifications_log
FOR INSERT
WITH CHECK (true);

-- System can update notification logs (for delivery status)
CREATE POLICY "System can update notification logs"
ON public.notifications_log
FOR UPDATE
USING (true);

-- Create function for updating updated_at timestamp
CREATE TRIGGER update_notifications_log_updated_at
  BEFORE UPDATE ON public.notifications_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create booking status change trigger function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking notifications
DROP TRIGGER IF EXISTS trigger_booking_notifications ON public.bookings;
CREATE TRIGGER trigger_booking_notifications
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_notifications();