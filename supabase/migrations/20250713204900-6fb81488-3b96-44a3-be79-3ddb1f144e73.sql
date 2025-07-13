-- Drop the existing trigger and recreate with simpler logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simpler function that doesn't rely on metadata initially
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, role)
  VALUES (
    new.id, 
    new.email, 
    'customer'
  );
  RETURN new;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();