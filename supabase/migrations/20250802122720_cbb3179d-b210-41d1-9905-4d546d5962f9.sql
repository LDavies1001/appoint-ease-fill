-- Fix the RLS policy to allow anonymous review submissions
DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.platform_reviews;

-- Create a new policy that explicitly allows anonymous submissions
CREATE POLICY "Allow anonymous review submissions" 
ON public.platform_reviews 
FOR INSERT 
WITH CHECK (true);

-- Also ensure the select policy works for anonymous users
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.platform_reviews;

CREATE POLICY "Allow viewing approved reviews" 
ON public.platform_reviews 
FOR SELECT 
USING (is_approved = true);