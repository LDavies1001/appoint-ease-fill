import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Edit, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SocialMediaSectionProps {
  data: {
    facebook_url: string;
    instagram_url: string;
    tiktok_url: string;
  };
  userId: string;
  onUpdate: (data: any) => void;
}

export const SocialMediaSection: React.FC<SocialMediaSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({
          facebook_url: editData.facebook_url,
          instagram_url: editData.instagram_url,
          tiktok_url: editData.tiktok_url
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate(editData);
      setIsEditing(false);
      toast({
        title: "Social Media updated ✅",
        description: "Your social media links have been updated successfully"
      });
    } catch (error) {
      console.error('Error updating social media:', error);
      toast({
        title: "Update failed",
        description: "Could not update social media links",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  return (
    <Card className="relative transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Share2 className="h-5 w-5 text-secondary" />
          </div>
          <CardTitle className="text-xl">Social Media</CardTitle>
        </div>
        
        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 w-8 p-0 hover:bg-secondary/10"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isEditing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook</Label>
              <Input
                id="facebook_url"
                value={editData.facebook_url || ''}
                onChange={(e) => setEditData({ ...editData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourbusiness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input
                id="instagram_url"
                value={editData.instagram_url || ''}
                onChange={(e) => setEditData({ ...editData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/yourbusiness"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiktok_url">TikTok</Label>
              <Input
                id="tiktok_url"
                value={editData.tiktok_url || ''}
                onChange={(e) => setEditData({ ...editData, tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@yourbusiness"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="sm"
                variant="provider"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Facebook</p>
              <p className="font-medium">
                {data.facebook_url ? (
                  <a 
                    href={data.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {data.facebook_url}
                  </a>
                ) : (
                  'Not connected'
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Instagram</p>
              <p className="font-medium">
                {data.instagram_url ? (
                  <a 
                    href={data.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {data.instagram_url}
                  </a>
                ) : (
                  'Not connected'
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">TikTok</p>
              <p className="font-medium">
                {data.tiktok_url ? (
                  <a 
                    href={data.tiktok_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {data.tiktok_url}
                  </a>
                ) : (
                  'Not connected'
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};