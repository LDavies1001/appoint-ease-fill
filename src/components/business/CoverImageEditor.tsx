import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, X, Move, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const [imageScale, setImageScale] = useState(80);
  const [saving, setSaving] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setImageScale(80); // Start at 80% so the whole image is visible
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - (imagePosition.x / 100) * rect.width,
      y: e.clientY - rect.top - (imagePosition.y / 100) * rect.height
    });
    setIsDragging(true);
    e.preventDefault();
  }, [imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    const newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;

    setImagePosition({
      x: Math.max(-50, Math.min(150, newX)), // Allow positioning outside container
      y: Math.max(-50, Math.min(150, newY))
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleChange = (value: number[]) => {
    setImageScale(value[0]);
  };

  const handleReset = () => {
    setImagePosition({ x: 50, y: 50 });
    setImageScale(80);
  };

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

      // Update provider_details with the new cover image URL and settings
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
    setImagePosition({ x: 50, y: 50 });
    setImageScale(80);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl h-[85vh]">
        <DialogHeader>
          <DialogTitle>Edit Cover Photo</DialogTitle>
          <p className="text-sm text-gray-600">
            Upload an image and position it within your cover area. You have full control over size and placement.
          </p>
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

          <div className="flex-1 flex gap-4">
            {/* Preview Area */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-medium mb-2">Cover Photo Preview</h3>
              <div className="flex-1 relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                {previewImage ? (
                  <div
                    ref={containerRef}
                    className="relative w-full h-full cursor-move select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ aspectRatio: '16/9' }}
                  >
                    {/* Cover Photo Preview with 16:9 aspect ratio */}
                    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
                      <img
                        src={previewImage}
                        alt="Cover preview"
                        className="absolute transition-transform duration-100 ease-out object-contain"
                        style={{
                          width: `${imageScale}%`,
                          height: `${imageScale}%`,
                          left: `${imagePosition.x}%`,
                          top: `${imagePosition.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        draggable={false}
                      />
                    </div>

                    {/* Drag Indicator */}
                    {isDragging && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                          <Move className="h-4 w-4 mr-2" />
                          Repositioning image...
                        </div>
                      </div>
                    )}

                    {/* Center guides */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full relative">
                        {/* Vertical center line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 transform -translate-x-px"></div>
                        {/* Horizontal center line */}
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 transform -translate-y-px"></div>
                        {/* Rule of thirds grid */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/20" />
                          ))}
                        </div>
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
            </div>

            {/* Controls Panel */}
            {previewImage && (
              <div className="w-80 space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <h3 className="text-sm font-medium">Image Controls</h3>
                  
                  {/* Scale Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-600">Size</label>
                      <span className="text-sm font-mono">{imageScale}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ZoomOut className="h-4 w-4 text-gray-400" />
                      <Slider
                        value={[imageScale]}
                        onValueChange={handleScaleChange}
                        min={20}
                        max={200}
                        step={5}
                        className="flex-1"
                      />
                      <ZoomIn className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Position Display */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-600">Position</label>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-white p-2 rounded border">
                        <span className="text-gray-500">X:</span> {Math.round(imagePosition.x)}%
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <span className="text-gray-500">Y:</span> {Math.round(imagePosition.y)}%
                      </div>
                    </div>
                  </div>

                  {/* Reset Button */}
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Position & Size
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">How to use:</h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Drag the image to reposition it</li>
                    <li>• Use the size slider to zoom in/out</li>
                    <li>• Grid lines help with alignment</li>
                    <li>• Image can extend beyond cover area</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {previewImage && (
                <span>Your cover photo will be cropped to 16:9 aspect ratio</span>
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