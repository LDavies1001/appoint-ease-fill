-- Create a new table for provider's custom services
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2),
  duration_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure provider can't have duplicate service names
  UNIQUE(provider_id, service_name)
);

-- Enable RLS
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Create policies for provider_services
CREATE POLICY "Providers can manage their own services" 
ON public.provider_services 
FOR ALL 
USING (auth.uid() = provider_id);

-- Allow everyone to view active services (for customers browsing)
CREATE POLICY "Everyone can view active provider services" 
ON public.provider_services 
FOR SELECT 
USING (is_active = true);

-- Add foreign key constraint
ALTER TABLE public.provider_services 
ADD CONSTRAINT fk_provider_services_provider 
FOREIGN KEY (provider_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Modify availability_slots to optionally reference provider_services instead of just the global services
ALTER TABLE public.availability_slots 
ADD COLUMN IF NOT EXISTS provider_service_id UUID,
ADD COLUMN IF NOT EXISTS custom_service_name TEXT;

-- Add foreign key for provider_services
ALTER TABLE public.availability_slots 
ADD CONSTRAINT fk_availability_slots_provider_service 
FOREIGN KEY (provider_service_id) REFERENCES public.provider_services(id) ON DELETE SET NULL;

-- Add constraint to ensure either service_id OR provider_service_id OR custom_service_name is provided
ALTER TABLE public.availability_slots 
ADD CONSTRAINT chk_service_reference 
CHECK (
  (service_id IS NOT NULL) OR 
  (provider_service_id IS NOT NULL) OR 
  (custom_service_name IS NOT NULL)
);

-- Create trigger for updated_at on provider_services
CREATE TRIGGER update_provider_services_updated_at
BEFORE UPDATE ON public.provider_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();