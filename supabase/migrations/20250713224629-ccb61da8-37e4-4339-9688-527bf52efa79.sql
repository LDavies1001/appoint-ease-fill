-- Create storage bucket for certification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certifications', 'certifications', true);

-- Create RLS policies for certification uploads
CREATE POLICY "Users can view certification files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certifications');

CREATE POLICY "Providers can upload their own certifications" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can update their own certifications" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete their own certifications" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add certification_files column to provider_details table
ALTER TABLE public.provider_details 
ADD COLUMN certification_files TEXT[] DEFAULT ARRAY[]::TEXT[];