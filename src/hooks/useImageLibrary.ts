import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedImage {
  id?: string;
  name: string;
  url: string;
  bucket: string;
  folder?: string;
  serviceName?: string;
  size?: number;
  created_at?: string;
  // Portfolio and display properties
  show_in_portfolio?: boolean;
  isPinned?: boolean;
  caption?: string;
  category?: string;
}

export interface ServiceFolder {
  name: string;
  path: string;
  images: UploadedImage[];
}

export const useImageLibrary = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [serviceFolders, setServiceFolders] = useState<ServiceFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchUserImages = async () => {
    if (!profile?.user_id) return;
    
    try {
      const buckets = ['profile-photos', 'business-photos', 'portfolio'];
      const allImages: UploadedImage[] = [];

      for (const bucket of buckets) {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list(profile.user_id, {
            limit: 100,
            offset: 0
          });

        if (error) {
          console.error(`Error fetching from ${bucket}:`, error);
          continue;
        }

        if (files) {
          const bucketImages = files
            .filter(file => file.name !== '.emptyFolderPlaceholder')
            .map(file => {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(`${profile.user_id}/${file.name}`);
              
              return {
                name: file.name,
                url: publicUrl,
                bucket,
                size: file.metadata?.size,
                created_at: file.created_at
              };
            });
          
          allImages.push(...bucketImages);
        }
      }

      setImages(allImages);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error loading images",
        variant: "destructive"
      });
    }
  };

  const fetchServiceFolders = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data: serviceFolders, error } = await supabase.storage
        .from('portfolio')
        .list(`${profile.user_id}/services`, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Error fetching service folders:', error);
        return;
      }

      if (serviceFolders) {
        const folders: ServiceFolder[] = [];
        
        for (const folder of serviceFolders) {
          if (folder.name !== '.emptyFolderPlaceholder') {
            const { data: folderFiles, error: folderError } = await supabase.storage
              .from('portfolio')
              .list(`${profile.user_id}/services/${folder.name}`, {
                limit: 100,
                offset: 0
              });

            if (folderError) {
              console.error(`Error fetching files from ${folder.name}:`, folderError);
              continue;
            }

            const folderImages: UploadedImage[] = (folderFiles || [])
              .filter(file => file.name !== '.emptyFolderPlaceholder')
              .map(file => {
                const { data: { publicUrl } } = supabase.storage
                  .from('portfolio')
                  .getPublicUrl(`${profile.user_id}/services/${folder.name}/${file.name}`);
                
                return {
                  name: file.name,
                  url: publicUrl,
                  bucket: 'portfolio',
                  folder: folder.name,
                  serviceName: folder.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                  size: file.metadata?.size,
                  created_at: file.created_at
                };
              });

            folders.push({
              name: folder.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              path: folder.name,
              images: folderImages
            });
          }
        }
        
        setServiceFolders(folders);
      }
    } catch (error) {
      console.error('Error fetching service folders:', error);
    }
  };

  const createFoldersForExistingServices = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data: services, error } = await supabase
        .from('provider_services')
        .select('service_name')
        .eq('provider_id', profile.user_id);

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      if (services) {
        for (const service of services) {
          const serviceFolderName = service.service_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase();
          const folderPath = `${profile.user_id}/services/${serviceFolderName}/.emptyFolderPlaceholder`;
          
          const { data: existingFiles } = await supabase.storage
            .from('portfolio')
            .list(`${profile.user_id}/services/${serviceFolderName}`, {
              limit: 1,
              offset: 0
            });

          if (!existingFiles || existingFiles.length === 0) {
            const emptyFile = new Blob([''], { type: 'text/plain' });
            await supabase.storage
              .from('portfolio')
              .upload(folderPath, emptyFile);
          }
        }
      }
    } catch (error) {
      console.error('Error creating folders for existing services:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserImages(),
      fetchServiceFolders()
    ]);
    setLoading(false);
  };

  const deleteImage = async (image: UploadedImage) => {
    try {
      let filePath: string;
      if (image.folder) {
        filePath = `${profile?.user_id}/services/${image.folder}/${image.name}`;
      } else {
        filePath = `${profile?.user_id}/${image.name}`;
      }
      
      const { error } = await supabase.storage
        .from(image.bucket)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Image deleted successfully",
      });
      
      refreshData();
    } catch (error: any) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await createFoldersForExistingServices();
      await refreshData();
    };
    
    initializeData();
  }, [profile?.user_id]);

  return {
    images,
    serviceFolders,
    loading,
    refreshData,
    deleteImage
  };
};