-- Update the handle_new_user function to save phone, location, and name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, name, phone, location)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'customer')::public.user_role,
    COALESCE(new.raw_user_meta_data->>'full_name', null),
    COALESCE(new.raw_user_meta_data->>'phone', null),
    COALESCE(new.raw_user_meta_data->>'location', null)
  );
  RETURN new;
END;
$function$;