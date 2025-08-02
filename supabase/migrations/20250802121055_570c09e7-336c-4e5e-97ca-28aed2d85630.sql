-- Create a table for platform reviews/feedback
CREATE TABLE public.platform_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'business', 'both')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  review TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for platform reviews
CREATE POLICY "Anyone can view approved reviews" 
ON public.platform_reviews 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews" 
ON public.platform_reviews 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_platform_reviews_updated_at
BEFORE UPDATE ON public.platform_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample approved reviews to get started
INSERT INTO public.platform_reviews (name, email, user_type, rating, title, review, is_approved, is_featured) VALUES
('Sarah Johnson', 'sarah@example.com', 'customer', 5, 'Amazing booking experience!', 'Found the perfect lash technician through OpenSlot. The booking process was so smooth and easy. Highly recommend!', true, true),
('Emily Rose', 'emily@example.com', 'business', 5, 'Great platform for my business', 'As a beauty professional, OpenSlot has helped me connect with so many new clients. The interface is intuitive and my bookings have increased significantly.', true, true),
('Jessica Martinez', 'jessica@example.com', 'customer', 4, 'Love the convenience', 'Being able to see real-time availability and book instantly is a game-changer. Makes finding last-minute appointments so much easier!', true, false);