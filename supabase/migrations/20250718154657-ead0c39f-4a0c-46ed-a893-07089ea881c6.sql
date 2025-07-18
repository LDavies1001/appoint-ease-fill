-- Fix storage policies for business-photos bucket
-- First, let's ensure proper policies for user file uploads

-- Allow users to upload their own files to business-photos bucket
CREATE POLICY "Users can upload their own business photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own uploaded business photos
CREATE POLICY "Users can view their own business photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own business photos
CREATE POLICY "Users can update their own business photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own business photos
CREATE POLICY "Users can delete their own business photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Also ensure the portfolio bucket has proper policies
CREATE POLICY "Users can upload their own portfolio items" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own portfolio items" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own portfolio items" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own portfolio items" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure profile-photos bucket policies
CREATE POLICY "Users can upload their own profile photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own profile photos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Certifications bucket policies
CREATE POLICY "Users can upload their own certifications" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own certifications" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own certifications" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own certifications" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'certifications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);