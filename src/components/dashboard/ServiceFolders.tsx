import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Upload, Image } from 'lucide-react';
import { ServiceFolder } from '@/hooks/useImageLibrary';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ServiceFoldersProps {
  serviceFolders: ServiceFolder[];
  onRefresh: () => void;
}

const ServiceFolders: React.FC<ServiceFoldersProps> = ({ serviceFolders, onRefresh }) => {
  const [uploading, setUploading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetFolder: string) => {
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
        const filePath = `${profile?.user_id}/services/${targetFolder}/${fileName}`;

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

  if (serviceFolders.length === 0) {
    return null;
  }

  return (
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
                    onClick={() => window.open(folder.images[0].url, '_blank')}
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
  );
};

export default ServiceFolders;