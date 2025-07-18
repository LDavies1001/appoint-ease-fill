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
  size?: number;
  created_at?: string;
}

const LibraryTab = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserImages();
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        const filePath = `${profile?.user_id}/${fileName}`;

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
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <Button
            variant="hero"
            onClick={() => document.getElementById('image-upload')?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : images.length === 0 ? (
        <Card className="card-elegant p-8 text-center">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No images uploaded yet</p>
          <Button
            variant="outline"
            onClick={() => document.getElementById('image-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Image
          </Button>
        </Card>
      ) : (
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
      )}
    </div>
  );
};

export default LibraryTab;