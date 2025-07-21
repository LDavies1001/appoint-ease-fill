import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, X, Edit, Trash2 } from 'lucide-react';

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
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please choose an image file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `cover-${providerId}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('business-photos')
        .getPublicUrl(fileName);
        
      // Update provider_details with the new cover image URL
      const { error: updateError } = await supabase
        .from('provider_details')
        .upsert({ 
          user_id: providerId,
          cover_image_url: data.publicUrl 
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      onCoverImageUpdate(data.publicUrl);
      setDialogOpen(false);

      toast({
        title: "Cover photo updated",
        description: "Your cover photo has been uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading cover photo:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the cover photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
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

  if (!isOwner && !coverImageUrl) {
    return null; // Don't show anything if no cover and user is not owner
  }

  return (
    <div className="relative">
      {/* Cover Photo Display */}
      <div 
        className={`w-full bg-gradient-to-r from-muted via-muted/50 to-accent/10 border-b ${
          coverImageUrl ? 'h-64 md:h-80' : 'h-32'
        } overflow-hidden relative`}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={altText || "Business cover photo"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cover photo</p>
            </div>
          </div>
        )}
        
        {/* Overlay for business name/logo could go here */}
        {coverImageUrl && (
          <div className="absolute inset-0 bg-black/20"></div>
        )}
      </div>

      {/* Owner Controls */}
      {isOwner && (
        <div className="absolute top-4 right-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-background/80 backdrop-blur-sm border-white/20 hover:bg-background/90"
              >
                {coverImageUrl ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Cover
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Cover
                  </>
                )}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {coverImageUrl ? 'Edit Cover Photo' : 'Upload Cover Photo'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="cover-upload" className="text-sm font-medium">
                    Choose Image
                  </Label>
                  <div className="mt-2">
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: 1200x400px, max 5MB
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>
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
    </div>
  );
};