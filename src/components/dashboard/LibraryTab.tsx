import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Upload, Image, Eye, EyeOff, Building, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioImage {
  id: string;
  name: string;
  url: string;
  folder: string;
  size: number;
  created_at: string;
  show_in_portfolio: boolean;
}

const LibraryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [businessLogos, setBusinessLogos] = useState<PortfolioImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch business logos
      const { data: logoFiles, error: logoError } = await supabase.storage
        .from('business-photos')
        .list(`${user.id}/business-logos`, { limit: 100 });

      if (logoError) throw logoError;

      const logoImages = await Promise.all(
        (logoFiles || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('business-photos')
            .getPublicUrl(`${user.id}/business-logos/${file.name}`);
          
          return {
            id: file.id || file.name,
            name: file.name,
            url: urlData.publicUrl,
            folder: 'business-logos',
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            show_in_portfolio: false // We'll check this from portfolio_items later
          };
        })
      );

      // Fetch uploaded images
      const { data: uploadFiles, error: uploadError } = await supabase.storage
        .from('portfolio')
        .list(`${user.id}/uploaded-images`, { limit: 100 });

      if (uploadError) throw uploadError;

      const uploadImages = await Promise.all(
        (uploadFiles || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('portfolio')
            .getPublicUrl(`${user.id}/uploaded-images/${file.name}`);
          
          return {
            id: file.id || file.name,
            name: file.name,
            url: urlData.publicUrl,
            folder: 'uploaded-images',
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            show_in_portfolio: false // We'll check this from portfolio_items later
          };
        })
      );

      // Check which images are already in portfolio
      const { data: portfolioItems } = await supabase
        .from('portfolio_items')
        .select('image_url')
        .eq('provider_id', user.id);

      const portfolioUrls = new Set(portfolioItems?.map(item => item.image_url) || []);

      setBusinessLogos(logoImages.map(img => ({
        ...img,
        show_in_portfolio: portfolioUrls.has(img.url)
      })));

      setUploadedImages(uploadImages.map(img => ({
        ...img,
        show_in_portfolio: portfolioUrls.has(img.url)
      })));

    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to load images.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, folder: string) => {
    const files = event.target.files;
    if (!files || !user) return;

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 5MB.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const bucket = folder === 'business-logos' ? 'business-photos' : 'portfolio';
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      }

      toast({
        title: "Success",
        description: "Images uploaded successfully!",
      });

      fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload images.",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = '';
  };

  const togglePortfolioDisplay = async (image: PortfolioImage) => {
    if (!user) return;

    try {
      if (image.show_in_portfolio) {
        // Remove from portfolio
        const { error } = await supabase
          .from('portfolio_items')
          .delete()
          .eq('provider_id', user.id)
          .eq('image_url', image.url);

        if (error) throw error;
      } else {
        // Add to portfolio
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: user.id,
            title: image.name.replace(/\.[^/.]+$/, ""), // Remove file extension
            image_url: image.url,
            category: image.folder === 'business-logos' ? 'Business Logo' : 'General',
            description: ''
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Image ${image.show_in_portfolio ? 'removed from' : 'added to'} portfolio!`,
      });

      fetchImages();
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to update portfolio.",
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (image: PortfolioImage) => {
    if (!user) return;

    try {
      const bucket = image.folder === 'business-logos' ? 'business-photos' : 'portfolio';
      const filePath = `${user.id}/${image.folder}/${image.name}`;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) throw storageError;

      // Remove from portfolio if it was there
      if (image.show_in_portfolio) {
        await supabase
          .from('portfolio_items')
          .delete()
          .eq('provider_id', user.id)
          .eq('image_url', image.url);
      }

      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });

      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
      </div>
    );
  }

  const renderImageFolder = (title: string, images: PortfolioImage[], folder: string, icon: React.ReactNode) => (
    <Card className="card-elegant">
      <div className="p-6 border-b border-provider/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{images.length} images</p>
            </div>
          </div>
          <div>
            <input
              type="file"
              id={`${folder}-upload`}
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e, folder)}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById(`${folder}-upload`)?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {images.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No images in this folder yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  <Button
                    size="sm"
                    variant={image.show_in_portfolio ? "provider" : "outline"}
                    onClick={() => togglePortfolioDisplay(image)}
                    className="shadow-lg"
                  >
                    {image.show_in_portfolio ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        In Portfolio
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Add to Portfolio
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteImage(image)}
                    className="shadow-lg"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
          My Portfolio
        </h2>
      </div>

      <div className="space-y-6">
        {/* Business Logos Folder */}
        {renderImageFolder(
          "Business Logos",
          businessLogos,
          "business-logos",
          <Building className="h-5 w-5 text-provider" />
        )}

        {/* Uploaded Images Folder */}
        {renderImageFolder(
          "Uploaded Images",
          uploadedImages,
          "uploaded-images",
          <FolderOpen className="h-5 w-5 text-provider" />
        )}

        {/* Empty State */}
        {businessLogos.length === 0 && uploadedImages.length === 0 && (
          <Card className="card-elegant p-8 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No images uploaded yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload images to your Business Logos or Uploaded Images folders and enable them for your portfolio
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LibraryTab;