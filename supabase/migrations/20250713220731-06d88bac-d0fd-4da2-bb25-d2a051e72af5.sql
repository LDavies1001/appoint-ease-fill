-- Create storage buckets for profile and business photos
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('profile-photos', 'profile-photos', true),
  ('business-photos', 'business-photos', true);

-- Create policies for profile photos
CREATE POLICY "Anyone can view profile photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'profile-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policies for business photos
CREATE POLICY "Anyone can view business photos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'business-photos');

CREATE POLICY "Users can upload their own business photos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'business-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own business photos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'business-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business photos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'business-photos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);