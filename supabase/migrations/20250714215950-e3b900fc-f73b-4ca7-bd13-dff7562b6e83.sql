-- Create portfolio table for businesses to showcase their work
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_portfolio_provider 
    FOREIGN KEY (provider_id) 
    REFERENCES profiles(user_id) 
    ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio access
CREATE POLICY "Everyone can view portfolio items" 
ON public.portfolio_items 
FOR SELECT 
USING (true);

CREATE POLICY "Providers can manage their own portfolio" 
ON public.portfolio_items 
FOR ALL 
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_portfolio_items_updated_at
BEFORE UPDATE ON public.portfolio_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio', 'portfolio', true);

-- Create policies for portfolio storage
CREATE POLICY "Anyone can view portfolio images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolio');

CREATE POLICY "Providers can upload portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can update their portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete their portfolio images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);