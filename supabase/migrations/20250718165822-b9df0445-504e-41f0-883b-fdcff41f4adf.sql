-- Create user_roles table to support multiple roles per user
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role user_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure each user can only have one instance of each role
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add active_role column to profiles table (avoiding reserved keyword 'current_role')
ALTER TABLE public.profiles 
ADD COLUMN active_role user_role;

-- Update existing profiles to have their role also in user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- Update active_role to match the existing role
UPDATE public.profiles 
SET active_role = role;

-- Make active_role NOT NULL after setting values
ALTER TABLE public.profiles 
ALTER COLUMN active_role SET NOT NULL;

-- Add trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to also create user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;