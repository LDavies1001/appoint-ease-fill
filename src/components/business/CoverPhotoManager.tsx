import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, Edit, Trash2, Maximize2, RotateCcw } from 'lucide-react';
import { ImageCropUpload } from '@/components/ui/image-crop-upload';

interface CoverPhotoManagerProps {
  coverImageUrl?: string | null;
  providerId: string;
  onCoverImageUpdate: (url: string | null) => void;
  isOwner?: boolean;
}

export const CoverPhotoManager: React.FC<CoverPhotoManagerProps> = ({
  coverImageUrl,
  providerId,
  onCoverImageUpdate,
  isOwner = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
  const [imageScale, setImageScale] = useState([100]);
  const [imagePositionX, setImagePositionX] = useState([50]);
  const [imagePositionY, setImagePositionY] = useState([50]);
  const { toast } = useToast();

  const handleCoverUpload = async (url: string) => {
    try {
      // Update provider_details with the new cover image URL
      const { error: updateError } = await supabase
        .from('provider_details')
        .upsert({ 
          user_id: providerId,
          cover_image_url: url 
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      onCoverImageUpdate(url);
      setDialogOpen(false);

      toast({
        title: "Cover photo updated",
        description: "Your cover photo has been uploaded successfully"
      });
    } catch (error) {
      console.error('Error updating cover photo:', error);
      toast({
        title: "Upload failed",
        description: "Could not update the cover photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveCover = async () => {
    try {
      // Update provider_details to remove cover image URL
      const { error } = await supabase
        .from('provider_details')
        .update({ cover_image_url: null })
        .eq('user_id', providerId);

      if (error) throw error;

      onCoverImageUpdate(null);
      setDialogOpen(false);

      toast({
        title: "Cover photo removed",
        description: "Your cover photo has been removed successfully"
      });
    } catch (error) {
      console.error('Error removing cover photo:', error);
      toast({
        title: "Remove failed",
        description: "Could not remove the cover photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveResize = async () => {
    try {
      // Update provider_details with new cover image settings
      const { error } = await supabase
        .from('provider_details')
        .update({ 
          cover_image_url: coverImageUrl,
          // You could store scale and position settings in a JSON field if needed
          // cover_image_settings: { scale: imageScale[0], position: imagePosition[0] }
        })
        .eq('user_id', providerId);

      if (error) throw error;

      setResizeDialogOpen(false);
      toast({
        title: "Cover photo resized",
        description: "Your cover photo size has been updated successfully"
      });
    } catch (error) {
      console.error('Error saving resize settings:', error);
      toast({
        title: "Resize failed",
        description: "Could not save resize settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetImage = () => {
    setImageScale([100]);
    setImagePositionX([50]);
    setImagePositionY([50]);
    toast({
      title: "Image reset",
      description: "Cover photo has been reset to fit the entire image"
    });
  };

  if (!isOwner && !coverImageUrl) {
    return null; // Don't show anything if no cover and user is not owner
  }

  return (
    <>
      {/* Background Cover Image */}
      {coverImageUrl && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={coverImageUrl}
            alt={altText || "Business cover photo"}
            className="absolute transition-all duration-300 ease-out"
            style={{
              width: `${imageScale[0]}%`,
              height: `${imageScale[0]}%`,
              left: `${imagePositionX[0]}%`,
              top: `${imagePositionY[0]}%`,
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              minWidth: '100%',
              minHeight: '100%'
            }}
          />
        </div>
      )}

      {/* Owner Controls */}
      {isOwner && (
        <div className="absolute top-4 right-4 z-10">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-800 shadow-lg"
                >
                  {coverImageUrl ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Cover
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Add Cover Photo
                    </>
                  )}
                </Button>
                
                {coverImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResizeDialogOpen(true)}
                    className="bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 text-gray-800 shadow-lg"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Resize
                  </Button>
                )}
              </div>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {coverImageUrl ? 'Edit Cover Photo' : 'Upload Cover Photo'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Image Upload with Crop */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Choose Cover Image
                  </Label>
                  <ImageCropUpload
                    onUpload={handleCoverUpload}
                    bucket="business-photos"
                    folder="covers"
                    aspectRatio={3} // 3:1 aspect ratio for cover photos (standardized)
                    title="Upload Cover Photo"
                    description="Recommended: 1200x400px for best results"
                  >
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload and crop your cover photo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 1200x400px, max 10MB
                      </p>
                    </div>
                  </ImageCropUpload>
                </div>

                {/* Alt Text (Optional) */}
                <div>
                  <Label htmlFor="alt-text" className="text-sm font-medium">
                    Alt Text (Optional)
                  </Label>
                  <Input
                    id="alt-text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe your cover photo for accessibility"
                    className="mt-1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {coverImageUrl && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveCover}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Resize Dialog */}
      <Dialog open={resizeDialogOpen} onOpenChange={setResizeDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resize Cover Photo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden border-2 border-dashed border-border">
              {coverImageUrl && (
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={coverImageUrl}
                    alt="Cover photo preview"
                    className="absolute transition-all duration-300 ease-out"
                    style={{
                      width: `${imageScale[0]}%`,
                      height: `${imageScale[0]}%`,
                      left: `${imagePositionX[0]}%`,
                      top: `${imagePositionY[0]}%`,
                      transform: 'translate(-50%, -50%)',
                      objectFit: 'cover',
                      minWidth: '100%',
                      minHeight: '100%'
                    }}
                  />
                </div>
              )}
              <div className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                Preview
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Image Scale: {imageScale[0]}%
                </Label>
                <Slider
                  value={imageScale}
                  onValueChange={setImageScale}
                  max={200}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>50%</span>
                  <span>100%</span>
                  <span>200%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Horizontal Position: {imagePositionX[0]}%
                </Label>
                <Slider
                  value={imagePositionX}
                  onValueChange={setImagePositionX}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Vertical Position: {imagePositionY[0]}%
                </Label>
                <Slider
                  value={imagePositionY}
                  onValueChange={setImagePositionY}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Top</span>
                  <span>Center</span>
                  <span>Bottom</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setResizeDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleResetImage}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleSaveResize}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};