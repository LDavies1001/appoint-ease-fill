import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit3, Upload, Save, RotateCcw } from 'lucide-react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverImageEditorProps {
  currentImage: string | null;
  onImageUpdate: (imageUrl: string) => void;
  providerId: string;
}

export const CoverImageEditor = ({ currentImage, onImageUpdate, providerId }: CoverImageEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Reset crop when new image is selected
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
    }
  };

  const getCroppedImg = useCallback((image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) {
      toast({
        title: "Error",
        description: "Please select and crop an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let croppedImageBlob: Blob;
      
      // If we're cropping an existing image (no selectedFile), we need to handle it differently
      if (!selectedFile && previewUrl) {
        // For existing images, we're working with the preview URL
        croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      } else if (selectedFile) {
        // For new uploads, use the standard flow
        croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      } else {
        throw new Error('No image to process');
      }
      
      // Create a file from the blob
      const fileName = `cover-${providerId}-${Date.now()}.jpg`;
      const croppedFile = new File([croppedImageBlob], fileName, { type: 'image/jpeg' });

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, croppedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(uploadData.path);

      // Create or update portfolio item with cover template
      const { error: portfolioError } = await supabase
        .from('portfolio_items')
        .upsert({
          provider_id: providerId,
          title: 'Cover Image',
          image_url: publicUrl,
          template_type: 'cover',
          is_public: false,
          description: 'Profile cover image'
        }, {
          onConflict: 'provider_id,template_type'
        });

      if (portfolioError) throw portfolioError;

      onImageUpdate(publicUrl);
      setIsOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      toast({
        title: "Success",
        description: "Cover image updated successfully!",
      });

    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast({
        title: "Error",
        description: "Failed to update cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetCrop = () => {
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg w-full"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          {currentImage ? 'Recrop Image' : 'Upload Cover'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{currentImage ? 'Recrop Cover Image' : 'Upload Cover Image'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {currentImage ? 'Choose New Image' : 'Choose Image'}
            </Button>
          </div>

          {/* Option to crop current image if it exists */}
          {!selectedFile && currentImage && (
            <div>
              <Button
                onClick={() => {
                  setPreviewUrl(currentImage);
                  setCrop({
                    unit: '%',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                  });
                }}
                variant="secondary"
                className="w-full"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Recrop Current Image
              </Button>
            </div>
          )}

          {/* Current Image Preview (if no new file selected and not recropping) */}
          {!previewUrl && currentImage && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current cover image:</p>
              <img
                src={currentImage}
                alt="Current cover"
                className="max-w-full max-h-40 object-contain mx-auto rounded-lg"
              />
            </div>
          )}

          {/* Image Cropper */}
          {previewUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Crop your image:</p>
                <Button
                  onClick={resetCrop}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Crop
                </Button>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={16 / 9} // 16:9 aspect ratio for cover images
                  minWidth={200}
                  minHeight={112}
                >
                  <img
                    ref={imgRef}
                    src={previewUrl}
                    alt="Crop preview"
                    className="max-w-full max-h-96 object-contain"
                  />
                </ReactCrop>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCroppedImage}
                  disabled={isUploading || !completedCrop}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isUploading ? 'Saving...' : 'Save Cover Image'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};