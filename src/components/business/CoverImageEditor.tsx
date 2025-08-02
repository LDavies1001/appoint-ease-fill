import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, X, Move, ZoomIn, ZoomOut } from 'lucide-react';

interface CoverImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  currentCoverUrl?: string | null;
  onSave: (url: string) => void;
}

export const CoverImageEditor: React.FC<CoverImageEditorProps> = ({
  isOpen,
  onClose,
  providerId,
  currentCoverUrl,
  onSave,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(currentCoverUrl || null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const COVER_ASPECT_RATIO = 16 / 9;

  useEffect(() => {
    if (previewImage && imageRef.current) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        
        // Auto-fit the image to cover the entire cover area
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;
          
          const imageAspectRatio = img.naturalWidth / img.naturalHeight;
          const containerAspectRatio = containerWidth / containerHeight;
          
          let scale;
          if (imageAspectRatio > containerAspectRatio) {
            // Image is wider than container
            scale = containerHeight / img.naturalHeight;
          } else {
            // Image is taller than container
            scale = containerWidth / img.naturalWidth;
          }
          
          setImageScale(Math.max(scale, 1)); // Ensure image covers the area
          setImagePosition({ x: 0, y: 0 }); // Center the image
        }
      };
      img.src = previewImage;
    }
  }, [previewImage]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialX: imagePosition.x,
      initialY: imagePosition.y
    });
    e.preventDefault();
  }, [imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imageRef.current) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const container = containerRef.current.getBoundingClientRect();
    const scaledImageWidth = imageDimensions.width * imageScale;
    const scaledImageHeight = imageDimensions.height * imageScale;
    
    // Calculate movement constraints to keep image within cover area
    const maxX = Math.max(0, (scaledImageWidth - container.width) / 2);
    const maxY = Math.max(0, (scaledImageHeight - container.height) / 2);
    
    const newX = Math.max(-maxX, Math.min(maxX, dragStart.initialX + deltaX));
    const newY = Math.max(-maxY, Math.min(maxY, dragStart.initialY + deltaY));
    
    setImagePosition({ x: newX, y: newY });
  }, [isDragging, dragStart, imageDimensions, imageScale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleChange = (value: number[]) => {
    if (!containerRef.current) return;
    
    const newScale = value[0];
    const container = containerRef.current.getBoundingClientRect();
    
    // Ensure the image always covers the container
    const minScaleX = container.width / imageDimensions.width;
    const minScaleY = container.height / imageDimensions.height;
    const minScale = Math.max(minScaleX, minScaleY);
    
    const clampedScale = Math.max(newScale, minScale);
    setImageScale(clampedScale);
    
    // Adjust position to keep image within bounds
    const scaledImageWidth = imageDimensions.width * clampedScale;
    const scaledImageHeight = imageDimensions.height * clampedScale;
    
    const maxX = Math.max(0, (scaledImageWidth - container.width) / 2);
    const maxY = Math.max(0, (scaledImageHeight - container.height) / 2);
    
    setImagePosition(prev => ({
      x: Math.max(-maxX, Math.min(maxX, prev.x)),
      y: Math.max(-maxY, Math.min(maxY, prev.y))
    }));
  };

  // Convert the cover area to a canvas and create a cropped image
  const createCroppedImage = async (): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (!containerRef.current || !imageRef.current || !uploadedFile) {
        reject(new Error('Missing required elements'));
        return;
      }

      const container = containerRef.current.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size to cover photo dimensions
      canvas.width = 1200; // Standard cover photo width
      canvas.height = canvas.width / COVER_ASPECT_RATIO;

      const img = new Image();
      img.onload = () => {
        // Calculate the source rectangle from the original image
        const scaleRatio = canvas.width / container.width;
        const sourceX = Math.max(0, -imagePosition.x * scaleRatio);
        const sourceY = Math.max(0, -imagePosition.y * scaleRatio);
        const sourceWidth = canvas.width;
        const sourceHeight = canvas.height;
        
        // Calculate the scaled image dimensions
        const scaledWidth = imageDimensions.width * imageScale * scaleRatio;
        const scaledHeight = imageDimensions.height * imageScale * scaleRatio;
        
        // Draw the image on the canvas
        ctx.drawImage(
          img,
          sourceX / scaleRatio * (img.naturalWidth / (imageDimensions.width * imageScale)),
          sourceY / scaleRatio * (img.naturalHeight / (imageDimensions.height * imageScale)),
          img.naturalWidth * (sourceWidth / scaledWidth),
          img.naturalHeight * (sourceHeight / scaledHeight),
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'cover-photo.jpg', { type: 'image/jpeg' });
            resolve(file);
          } else {
            reject(new Error('Could not create image blob'));
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = previewImage!;
    });
  };

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = `cover-${providerId}-${Date.now()}.jpg`;
    const filePath = `${providerId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('business-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('business-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (!uploadedFile || !previewImage) {
        throw new Error('No image to save');
      }

      // Create cropped image from the current view
      const croppedFile = await createCroppedImage();
      
      // Upload the cropped image
      const finalImageUrl = await uploadToSupabase(croppedFile);

      // Update provider_details
      const { error } = await supabase
        .from('provider_details')
        .upsert({
          user_id: providerId,
          cover_image_url: finalImageUrl,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onSave(finalImageUrl);
      onClose();
      
      toast({
        title: "Cover photo saved",
        description: "Your cover photo has been updated successfully"
      });
    } catch (error) {
      console.error('Error saving cover photo:', error);
      toast({
        title: "Save failed",
        description: "Could not save the cover photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setPreviewImage(currentCoverUrl || null);
    setUploadedFile(null);
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
    onClose();
  };

  // Calculate min scale to ensure image covers container
  const getMinScale = () => {
    if (!containerRef.current || !imageDimensions.width || !imageDimensions.height) return 1;
    
    const container = containerRef.current.getBoundingClientRect();
    const minScaleX = container.width / imageDimensions.width;
    const minScaleY = container.height / imageDimensions.height;
    return Math.max(minScaleX, minScaleY);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
          <p className="text-sm text-gray-600">
            Position and resize your image within the cover photo area
          </p>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Upload Button */}
          {!previewImage && (
            <div className="mb-4">
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
                Choose Cover Photo
              </Button>
            </div>
          )}

          {/* Cover Photo Editor */}
          {previewImage && (
            <div className="flex-1 flex flex-col">
              {/* Cover Photo Container */}
              <div className="flex-1 relative">
                <div
                  ref={containerRef}
                  className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden cursor-move select-none"
                  style={{ aspectRatio: '16/9' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imageRef}
                    src={previewImage}
                    alt="Cover photo preview"
                    className="absolute transition-transform duration-100 ease-out"
                    style={{
                      width: `${imageDimensions.width * imageScale}px`,
                      height: `${imageDimensions.height * imageScale}px`,
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    }}
                    draggable={false}
                  />
                  
                  {/* Drag overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="bg-black/70 text-white px-4 py-2 rounded-lg flex items-center">
                        <Move className="h-4 w-4 mr-2" />
                        Drag to reposition
                      </div>
                    </div>
                  )}
                  
                  {/* Border overlay */}
                  <div className="absolute inset-0 border-2 border-white/20 pointer-events-none" />
                </div>
              </div>

              {/* Controls */}
              <div className="mt-4 space-y-4">
                {/* Scale Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Zoom</label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Change Photo
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ZoomOut className="h-4 w-4 text-gray-400" />
                    <Slider
                      value={[imageScale]}
                      onValueChange={handleScaleChange}
                      min={getMinScale()}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Drag the image to reposition it within the cover area
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!previewImage || !uploadedFile || saving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Cover Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};