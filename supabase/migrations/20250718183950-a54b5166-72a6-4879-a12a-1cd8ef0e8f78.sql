-- Add tags support and sharing features to portfolio_items
ALTER TABLE public.portfolio_items 
ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN is_public BOOLEAN DEFAULT false,
ADD COLUMN public_slug TEXT UNIQUE,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN template_type TEXT;

-- Create index for better tag searching
CREATE INDEX idx_portfolio_items_tags ON public.portfolio_items USING GIN(tags);

-- Create index for public slugs
CREATE INDEX idx_portfolio_items_public_slug ON public.portfolio_items(public_slug) WHERE public_slug IS NOT NULL;

-- Create function to generate unique slugs
CREATE OR REPLACE FUNCTION public.generate_portfolio_slug(title TEXT, provider_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'portfolio-item';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM public.portfolio_items WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Create trigger to auto-generate slugs when is_public is true
CREATE OR REPLACE FUNCTION public.handle_portfolio_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Generate slug when making public and slug doesn't exist
  IF NEW.is_public = true AND (OLD.public_slug IS NULL OR OLD.is_public = false) THEN
    NEW.public_slug := public.generate_portfolio_slug(NEW.title, NEW.provider_id);
  END IF;
  
  -- Clear slug when making private
  IF NEW.is_public = false THEN
    NEW.public_slug := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER portfolio_slug_trigger
  BEFORE INSERT OR UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_portfolio_slug();