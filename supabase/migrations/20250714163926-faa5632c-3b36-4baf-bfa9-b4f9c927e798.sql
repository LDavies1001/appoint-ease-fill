-- Create table for customer favourite businesses
CREATE TABLE public.customer_favourites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, provider_id)
);

-- Enable RLS on customer_favourites
ALTER TABLE public.customer_favourites ENABLE ROW LEVEL SECURITY;

-- Create policies for customer_favourites
CREATE POLICY "Users can view their own favourites" 
ON public.customer_favourites 
FOR SELECT 
USING (auth.uid() = customer_id);

CREATE POLICY "Users can add their own favourites" 
ON public.customer_favourites 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can remove their own favourites" 
ON public.customer_favourites 
FOR DELETE 
USING (auth.uid() = customer_id);

-- Create table for local offers and discounts
CREATE TABLE public.local_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  discount_amount NUMERIC,
  offer_code TEXT,
  min_spend NUMERIC,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_location TEXT,
  service_categories TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on local_offers
ALTER TABLE public.local_offers ENABLE ROW LEVEL SECURITY;

-- Create policies for local_offers
CREATE POLICY "Everyone can view active offers" 
ON public.local_offers 
FOR SELECT 
USING (is_active = true AND valid_until > now());

CREATE POLICY "Providers can manage their own offers" 
ON public.local_offers 
FOR ALL 
USING (auth.uid() = provider_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_local_offers_updated_at
BEFORE UPDATE ON public.local_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();