-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('customer', 'provider');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role user_role NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  location TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provider_details table for provider-specific information
CREATE TABLE public.provider_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT,
  services_offered TEXT[],
  availability_notes TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Create services table for standardized service types
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  typical_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert common services
INSERT INTO public.services (name, category, typical_duration) VALUES
('Lash Extensions', 'Beauty', 120),
('Nail Manicure', 'Beauty', 60),
('Nail Pedicure', 'Beauty', 90),
('House Cleaning', 'Cleaning', 180),
('Office Cleaning', 'Cleaning', 120),
('Massage Therapy', 'Wellness', 90),
('Hair Cut', 'Beauty', 45),
('Hair Color', 'Beauty', 150);

-- Create availability_slots table
CREATE TABLE public.availability_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  service_id UUID,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  price DECIMAL(10,2),
  notes TEXT,
  is_booked BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'weekly', 'daily', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (provider_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  slot_id UUID NOT NULL UNIQUE,
  service_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  price DECIMAL(10,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  customer_notes TEXT,
  provider_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES public.availability_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES public.services(id)
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view public provider profiles" 
ON public.profiles 
FOR SELECT 
USING (role = 'provider');

-- RLS Policies for provider_details
CREATE POLICY "Providers can manage their own details" 
ON public.provider_details 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view provider details" 
ON public.provider_details 
FOR SELECT 
USING (true);

-- RLS Policies for services (public read)
CREATE POLICY "Everyone can view services" 
ON public.services 
FOR SELECT 
USING (true);

-- RLS Policies for availability_slots
CREATE POLICY "Providers can manage their own slots" 
ON public.availability_slots 
FOR ALL 
USING (auth.uid() = provider_id);

CREATE POLICY "Everyone can view available slots" 
ON public.availability_slots 
FOR SELECT 
USING (true);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "Customers can create bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Providers can update booking status" 
ON public.bookings 
FOR UPDATE 
USING (auth.uid() = provider_id);

-- RLS Policies for reviews
CREATE POLICY "Users can view reviews about them" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can create reviews for their bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Everyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  );
  RETURN new;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_provider_details_updated_at BEFORE UPDATE ON public.provider_details FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();