-- Check and update storage bucket policies for slot images
-- First, ensure the business-photos bucket is public (if it exists)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'business-photos';

-- Create comprehensive policies for the business-photos bucket
CREATE POLICY "Anyone can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'business-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own business photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'business-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own business photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'business-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Also update portfolio bucket to be public if needed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'portfolio';

-- Create policies for portfolio bucket
CREATE POLICY "Anyone can view portfolio photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

CREATE POLICY "Authenticated users can upload portfolio photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own portfolio photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own portfolio photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);