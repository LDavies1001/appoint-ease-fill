import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Upload, Image, Eye } from 'lucide-react';
import { UploadedImage } from '@/hooks/useImageLibrary';
import ImageCard from './ImageCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GeneralImagesProps {
  images: UploadedImage[];
  onRefresh: () => void;
  onDeleteImage: (image: UploadedImage) => void;
}

const GeneralImages: React.FC<GeneralImagesProps> = ({ images, onRefresh, onDeleteImage }) => {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const formatBucketName = (bucket: string) => {
    if (bucket === 'profile-photos') return 'Profile Pictures';
    return bucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleGeneralUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      onRefresh();
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

  if (images.length === 0) {
    return null;
  }

  // Group images by bucket
  const imagesByBucket = images.reduce((acc, image) => {
    const bucketName = formatBucketName(image.bucket);
    if (!acc[bucketName]) acc[bucketName] = [];
    acc[bucketName].push(image);
    return acc;
  }, {} as Record<string, UploadedImage[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">General Images</h3>
        <div className="flex gap-2">
          {selectedBucket && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBucket(null)}
            >
              ← Back to Categories
            </Button>
          )}
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={handleGeneralUpload}
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
      
      {!selectedBucket ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(imagesByBucket).map(([bucketName, bucketImages]) => (
            <Card 
              key={bucketName} 
              className="card-elegant p-4 hover-scale cursor-pointer" 
              onClick={() => setSelectedBucket(bucketName)}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-foreground truncate">{bucketName}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBucket(bucketName);
                    }}
                    className="text-xs p-1 h-auto"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="aspect-[4/3] bg-muted/20 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {bucketImages.slice(0, 4).map((image, index) => (
                      <div key={`${bucketName}-${image.name}-${index}`} className="overflow-hidden rounded">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ))}
                    {bucketImages.length > 4 && (
                      <div className="bg-muted/40 flex items-center justify-center text-muted-foreground text-sm">
                        +{bucketImages.length - 4} more
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{bucketImages.length} image{bucketImages.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs">Click to view all</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-foreground">{selectedBucket}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images
              .filter(image => formatBucketName(image.bucket) === selectedBucket)
              .map((image, index) => (
                <ImageCard
                  key={`${image.bucket}-${image.name}-${index}`}
                  image={image}
                  onDelete={onDeleteImage}
                  showBucket={false}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralImages;