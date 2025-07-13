-- Fix the handle_new_user function to include role with a default value
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name'),
    COALESCE((new.raw_user_meta_data ->> 'role')::user_role, 'customer'::user_role)
  );
  RETURN new;
END;
$function$;