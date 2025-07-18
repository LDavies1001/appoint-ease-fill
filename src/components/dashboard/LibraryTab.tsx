import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Trash2, Eye } from 'lucide-react';

interface UploadedImage {
  name: string;
  url: string;
  bucket: string;
  folder?: string;
  serviceName?: string;
  size?: number;
  created_at?: string;
}

interface ServiceFolder {
  name: string;
  path: string;
  images: UploadedImage[];
}

const LibraryTab = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [serviceFolders, setServiceFolders] = useState<ServiceFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserImages();
    fetchServiceFolders();
    createFoldersForExistingServices();
  }, []);

  const fetchUserImages = async () => {
    if (!profile?.user_id) return;
    
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceFolders = async () => {
    if (!profile?.user_id) return;
    
    try {
      // Get service folders from portfolio bucket
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
            // Get images in this service folder
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
      // Get all provider services
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
          
          // Check if folder already exists
          const { data: existingFiles } = await supabase.storage
            .from('portfolio')
            .list(`${profile.user_id}/services/${serviceFolderName}`, {
              limit: 1,
              offset: 0
            });

          // Create folder if it doesn't exist
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetFolder?: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is over 5MB. Please select smaller images.`,
            variant: "destructive"
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        let filePath: string;
        if (targetFolder) {
          filePath = `${profile?.user_id}/services/${targetFolder}/${fileName}`;
        } else {
          filePath = `${profile?.user_id}/${fileName}`;
        }

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
        }
      }

      toast({
        title: "Images uploaded successfully!",
      });
      
      fetchUserImages();
      fetchServiceFolders();
    } catch (error: any) {
      toast({
        title: "Error uploading images",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };


  const handleDeleteImage = async (image: UploadedImage) => {
    try {
      const filePath = `${profile?.user_id}/${image.name}`;
      
      const { error } = await supabase.storage
        .from(image.bucket)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Image deleted successfully",
      });
      
      fetchUserImages();
      fetchServiceFolders();
    } catch (error: any) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatBucketName = (bucket: string) => {
    if (bucket === 'profile-photos') return 'Profile Pictures';
    return bucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Image Library</h2>
        <div className="flex gap-2">
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e)}
            className="hidden"
            id="general-upload"
            disabled={uploading}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('general-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            General Upload
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Service Folders */}
          {serviceFolders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Service Portfolios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceFolders.map((folder) => (
                  <Card key={folder.path} className="card-elegant p-4 hover-scale">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-foreground truncate">{folder.name}</h4>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, folder.path)}
                          className="hidden"
                          id={`upload-${folder.path}`}
                          disabled={uploading}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`upload-${folder.path}`)?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Add'}
                        </Button>
                      </div>
                      
                      <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                        {folder.images.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Image className="h-8 w-8 mb-2" />
                            <p className="text-sm text-center">No photos yet</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-1 h-full">
                            {folder.images.slice(0, 4).map((image, index) => (
                              <div key={`${folder.path}-${image.name}-${index}`} className="overflow-hidden rounded">
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                                  onClick={() => window.open(image.url, '_blank')}
                                />
                              </div>
                            ))}
                            {folder.images.length > 4 && (
                              <div className="bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
                                +{folder.images.length - 4} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>{folder.images.length} photo{folder.images.length !== 1 ? 's' : ''}</span>
                        {folder.images.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View all images logic could go here
                              window.open(folder.images[0].url, '_blank');
                            }}
                            className="text-xs p-1 h-auto"
                          >
                            View All
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* General Images */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">General Images</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <Card key={`${image.bucket}-${image.name}-${index}`} className="card-elegant overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-foreground truncate">{image.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBucketName(image.bucket)}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(image.url, '_blank')}
                          className="flex-1"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteImage(image)}
                          className="flex-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {serviceFolders.length === 0 && images.length === 0 && (
            <Card className="card-elegant p-8 text-center">
              <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No images uploaded yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create services to automatically get organized photo folders, or upload general images
              </p>
              <Button
                variant="outline"
                onClick={() => document.getElementById('general-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Image
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default LibraryTab;