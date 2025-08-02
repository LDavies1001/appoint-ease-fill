-- Just ensure the storage buckets are public for image viewing
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('business-photos', 'portfolio', 'profile-photos', 'certifications');