import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Edit2, Save, X, Upload } from 'lucide-react';

interface BusinessBrandingData {
  business_logo_url: string;
  cover_image_url: string;
  business_name: string;
}

interface BusinessBrandingSectionProps {
  data: BusinessBrandingData;
  userId: string;
  onUpdate: (updatedData: Partial<BusinessBrandingData>) => void;
}

export const BusinessBrandingSection: React.FC<BusinessBrandingSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose a file under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('business-photos')
        .getPublicUrl(fileName);

      const updateField = type === 'logo' ? 'business_logo_url' : 'cover_image_url';
      
      // Update database
      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ [updateField]: urlData.publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local state
      onUpdate({ [updateField]: urlData.publicUrl });
      
      toast({
        title: `${type === 'logo' ? 'Logo' : 'Cover image'} updated`,
        description: "Your image has been uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = async (type: 'logo' | 'cover') => {
    try {
      const updateField = type === 'logo' ? 'business_logo_url' : 'cover_image_url';
      
      const { error } = await supabase
        .from('provider_details')
        .update({ [updateField]: null })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate({ [updateField]: '' });
      
      toast({
        title: `${type === 'logo' ? 'Logo' : 'Cover image'} removed`,
        description: "Image has been removed successfully"
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove failed",
        description: "Could not remove the image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Business Branding</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Business Logo Section */}
        <div>
          <h4 className="font-medium mb-3">Business Logo</h4>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={data.business_logo_url} />
              <AvatarFallback className="text-lg font-bold bg-primary/10">
                {data.business_name?.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
            
            {isEditing && (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading === 'logo'}
                  />
                  <Button
                    size="sm"
                    disabled={uploading === 'logo'}
                    className="w-full"
                  >
                    {uploading === 'logo' ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Logo
                  </Button>
                </div>
                {data.business_logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage('logo')}
                    className="w-full"
                  >
                    Remove Logo
                  </Button>
                )}
              </div>
            )}
            
            {!isEditing && (
              <div>
                {data.business_logo_url ? (
                  <div>
                    <p className="text-sm text-muted-foreground">Logo uploaded</p>
                    <p className="text-xs text-muted-foreground">Click edit to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground">No logo uploaded</p>
                    <p className="text-xs text-muted-foreground">Click edit to add</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Cover Image Section */}
        <div>
          <h4 className="font-medium mb-3">Cover Image</h4>
          <div className="relative">
            <div className="h-16 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {data.cover_image_url ? (
                <img 
                  src={data.cover_image_url} 
                  alt="Cover" 
                  className="h-full w-full object-cover rounded" 
                />
              ) : (
                <p className="text-xs text-muted-foreground">No cover image</p>
              )}
            </div>
            
            {isEditing && (
              <div className="mt-2 space-y-2">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'cover');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading === 'cover'}
                  />
                  <Button
                    size="sm"
                    disabled={uploading === 'cover'}
                    className="w-full"
                  >
                    {uploading === 'cover' ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Cover
                  </Button>
                </div>
                {data.cover_image_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveImage('cover')}
                    className="w-full"
                  >
                    Remove Cover
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};