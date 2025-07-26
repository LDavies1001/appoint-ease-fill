-- Create beauty journey gallery table
CREATE TABLE public.beauty_journey_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'inspiration')),
  image_url TEXT NOT NULL,
  description TEXT,
  treatment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beauty_journey_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own photos" 
ON public.beauty_journey_photos 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can upload their own photos" 
ON public.beauty_journey_photos 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own photos" 
ON public.beauty_journey_photos 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own photos" 
ON public.beauty_journey_photos 
FOR DELETE 
USING (auth.uid() = customer_id);

-- Create inspiration boards table
CREATE TABLE public.inspiration_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspiration_boards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own boards" 
ON public.inspiration_boards 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Everyone can view public boards" 
ON public.inspiration_boards 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create their own boards" 
ON public.inspiration_boards 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own boards" 
ON public.inspiration_boards 
FOR UPDATE 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own boards" 
ON public.inspiration_boards 
FOR DELETE 
USING (auth.uid() = customer_id);

-- Create inspiration board items table
CREATE TABLE public.inspiration_board_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.inspiration_boards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  source_url TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inspiration_board_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view items from their own boards" 
ON public.inspiration_board_items 
FOR SELECT 
USING (
  board_id IN (
    SELECT id FROM public.inspiration_boards 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Everyone can view items from public boards" 
ON public.inspiration_board_items 
FOR SELECT 
USING (
  board_id IN (
    SELECT id FROM public.inspiration_boards 
    WHERE is_public = true
  )
);

CREATE POLICY "Users can add items to their own boards" 
ON public.inspiration_board_items 
FOR INSERT 
WITH CHECK (
  board_id IN (
    SELECT id FROM public.inspiration_boards 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can update items in their own boards" 
ON public.inspiration_board_items 
FOR UPDATE 
USING (
  board_id IN (
    SELECT id FROM public.inspiration_boards 
    WHERE customer_id = auth.uid()
  )
);

CREATE POLICY "Users can delete items from their own boards" 
ON public.inspiration_board_items 
FOR DELETE 
USING (
  board_id IN (
    SELECT id FROM public.inspiration_boards 
    WHERE customer_id = auth.uid()
  )
);

-- Create beauty badges table
CREATE TABLE public.beauty_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('service', 'loyalty', 'review', 'milestone', 'special')),
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beauty_badges ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to view badges
CREATE POLICY "Everyone can view badges" 
ON public.beauty_badges 
FOR SELECT 
USING (true);

-- Create customer badges table (earned badges)
CREATE TABLE public.customer_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.beauty_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.customer_badges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own badges" 
ON public.customer_badges 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "System can award badges" 
ON public.customer_badges 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- Enhance reviews table to support photos and videos
ALTER TABLE public.reviews 
ADD COLUMN photos TEXT[] DEFAULT '{}',
ADD COLUMN video_url TEXT,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN helpful_count INTEGER DEFAULT 0;

-- Insert some default badges
INSERT INTO public.beauty_badges (name, description, icon, badge_type, criteria) VALUES
('First Timer', 'Completed your first beauty appointment', '🌟', 'milestone', '{"bookings_count": 1}'),
('Beauty Explorer', 'Tried 5 different service types', '🗺️', 'service', '{"unique_services": 5}'),
('Loyal Customer', 'Completed 10 appointments', '💎', 'loyalty', '{"bookings_count": 10}'),
('Review Writer', 'Left 5 helpful reviews', '✍️', 'review', '{"reviews_count": 5}'),
('Trendsetter', 'One of the first to try a new service', '🔥', 'special', '{"early_adopter": true}'),
('Monthly Regular', 'Booked monthly for 6 months', '📅', 'loyalty', '{"monthly_streak": 6}'),
('Photo Enthusiast', 'Shared 10 before/after photos', '📸', 'special', '{"photos_count": 10}'),
('Beauty Guru', 'Completed 50 appointments', '👑', 'milestone', '{"bookings_count": 50}');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_beauty_journey_photos_updated_at
BEFORE UPDATE ON public.beauty_journey_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspiration_boards_updated_at
BEFORE UPDATE ON public.inspiration_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();