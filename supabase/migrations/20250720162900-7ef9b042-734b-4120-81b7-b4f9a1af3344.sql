-- Create table for social media connections
CREATE TABLE public.social_media_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  profile_url TEXT NOT NULL,
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, platform)
);

-- Enable RLS
ALTER TABLE public.social_media_connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active social connections" 
ON public.social_media_connections 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Providers can manage their own social connections" 
ON public.social_media_connections 
FOR ALL 
USING (auth.uid() = provider_id);

-- Add trigger for updated_at
CREATE TRIGGER update_social_media_connections_updated_at
BEFORE UPDATE ON public.social_media_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for clarity
COMMENT ON TABLE public.social_media_connections IS 'Stores social media platform connections for business providers';