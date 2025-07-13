-- Update the handle_new_user function with correct enum handling
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
    CASE 
      WHEN (new.raw_user_meta_data ->> 'role') = 'provider' THEN 'provider'
      ELSE 'customer'
    END
  );
  RETURN new;
END;
$function$;