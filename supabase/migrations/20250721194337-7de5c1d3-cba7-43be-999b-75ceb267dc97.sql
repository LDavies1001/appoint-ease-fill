-- Create storage policies for business-photos bucket to allow users to upload cover photos
CREATE POLICY "Allow authenticated users to upload business photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view business photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-photos');

CREATE POLICY "Allow users to update their own business photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own business photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'business-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);