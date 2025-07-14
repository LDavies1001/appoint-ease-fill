-- Add missing fields to provider_details table for comprehensive business profiles
ALTER TABLE public.provider_details 
ADD COLUMN IF NOT EXISTS business_category UUID,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS social_media_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
ADD COLUMN IF NOT EXISTS business_logo_url TEXT,
ADD COLUMN IF NOT EXISTS profile_published BOOLEAN DEFAULT false;

-- Create business categories enum and table
CREATE TYPE business_category_type AS ENUM (
  'beauty_wellness',
  'health_fitness', 
  'education_training',
  'professional_services',
  'home_services',
  'automotive',
  'food_beverage',
  'retail_shopping',
  'entertainment',
  'other'
);

-- Create business_categories reference table
CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_type business_category_type NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default business categories
INSERT INTO public.business_categories (name, category_type, description) VALUES
('Beauty & Wellness', 'beauty_wellness', 'Beauty salons, spas, wellness centers'),
('Health & Fitness', 'health_fitness', 'Gyms, personal trainers, health clinics'),
('Education & Training', 'education_training', 'Schools, tutoring, professional training'),
('Professional Services', 'professional_services', 'Legal, accounting, consulting services'),
('Home Services', 'home_services', 'Cleaning, maintenance, repair services'),
('Automotive', 'automotive', 'Car repair, maintenance, detailing'),
('Food & Beverage', 'food_beverage', 'Restaurants, cafes, catering'),
('Retail & Shopping', 'retail_shopping', 'Stores, boutiques, marketplaces'),
('Entertainment', 'entertainment', 'Events, photography, entertainment services'),
('Other', 'other', 'Other business types')
ON CONFLICT DO NOTHING;

-- Enable RLS on business_categories
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for business_categories (public read access)
CREATE POLICY "Anyone can view business categories" 
ON public.business_categories 
FOR SELECT 
USING (true);

-- Add foreign key constraint for business_category
ALTER TABLE public.provider_details 
ADD CONSTRAINT fk_business_category 
FOREIGN KEY (business_category) REFERENCES public.business_categories(id);