import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, X, Move } from 'lucide-react';

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
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [imageScale, setImageScale] = useState(100);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
        setImagePosition({ x: 50, y: 50 }); // Reset position for new image
        setImageScale(100);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setImagePosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const uploadToSupabase = async (file: File): Promise<string> => {
    const fileName = `cover-${providerId}-${Date.now()}.${file.name.split('.').pop()}`;
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
      let finalImageUrl = previewImage;

      // Upload new file if one was selected
      if (uploadedFile) {
        finalImageUrl = await uploadToSupabase(uploadedFile);
      }

      if (!finalImageUrl) throw new Error('No image to save');

      // Update provider_details with the new cover image URL and position
      const { error } = await supabase
        .from('provider_details')
        .upsert({
          user_id: providerId,
          cover_image_url: finalImageUrl,
          // Store position and scale in a JSON field if needed
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
    setImagePosition({ x: 50, y: 50 });
    setImageScale(100);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Upload Button */}
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
              Choose New Image
            </Button>
          </div>

          {/* Preview Area */}
          <div className="flex-1 relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            {previewImage ? (
              <div
                ref={containerRef}
                className="relative w-full h-full cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Cover Photo Preview */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    ref={imageRef}
                    src={previewImage}
                    alt="Cover preview"
                    className="absolute transition-transform duration-150 ease-out"
                    style={{
                      width: `${imageScale}%`,
                      height: `${imageScale}%`,
                      left: `${imagePosition.x}%`,
                      top: `${imagePosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      objectFit: 'cover',
                      minWidth: '100%',
                      minHeight: '100%'
                    }}
                    draggable={false}
                  />
                </div>

                {/* Drag Indicator */}
                {isDragging && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                      <Move className="h-4 w-4 mr-2" />
                      Drag to position
                    </div>
                  </div>
                )}

                {/* Grid overlay for better positioning */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-white/20" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Choose an image to get started</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {previewImage && (
                <span>Click and drag the image to reposition it</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!previewImage || saving}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Cover Photo'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};