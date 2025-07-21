import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  X, 
  Edit, 
  Pin, 
  Star, 
  Trash2, 
  Image as ImageIcon,
  ArrowLeft,
  Crown,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/ui/header';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  caption: string;
  category: string;
  isPinned: boolean;
  isCover: boolean;
  created_at: string;
  size: number;
}

const BusinessMediaLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchMediaItems();
  }, [user]);

  const fetchMediaItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch from portfolio bucket
      const { data: files, error } = await supabase.storage
        .from('portfolio')
        .list(`${user.id}/media-library`, { limit: 100 });

      if (error) throw error;

      // Get metadata for each file
      const items = await Promise.all(
        (files || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('portfolio')
            .getPublicUrl(`${user.id}/media-library/${file.name}`);

          // Try to get metadata from portfolio_items table
          const { data: portfolioData } = await supabase
            .from('portfolio_items')
            .select('*')
            .eq('provider_id', user.id)
            .eq('image_url', urlData.publicUrl)
            .single();

          return {
            id: file.id || file.name,
            filename: file.name,
            url: urlData.publicUrl,
            caption: portfolioData?.description || '',
            category: portfolioData?.category || 'General',
            isPinned: portfolioData?.featured || false,
            isCover: portfolioData?.template_type === 'cover' || false,
            created_at: file.created_at || new Date().toISOString(),
            size: file.metadata?.size || 0
          };
        })
      );

      // Sort: pinned first, then cover, then by date
      const sortedItems = items.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        if (a.isCover && !b.isCover) return -1;
        if (!a.isCover && b.isCover) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setMediaItems(sortedItems);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: "Error",
        description: "Failed to load media library.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;

    try {
      setUploading(true);
      const uploadedFiles = [];

      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} is larger than 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        if (!file.type.startsWith('image/')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image.`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/media-library/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        uploadedFiles.push(fileName);
      }

      if (uploadedFiles.length > 0) {
        toast({
          title: "Success",
          description: `${uploadedFiles.length} image(s) uploaded successfully!`,
        });
        fetchMediaItems();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const updateCaption = async (item: MediaItem, newCaption: string) => {
    if (!user) return;

    try {
      // Check if portfolio item exists
      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        // Update existing
        const { error } = await supabase
          .from('portfolio_items')
          .update({ description: newCaption })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Create new portfolio item
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: user.id,
            title: item.filename.replace(/\.[^/.]+$/, ""),
            description: newCaption,
            image_url: item.url,
            category: item.category
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Caption updated successfully!",
      });

      fetchMediaItems();
    } catch (error) {
      console.error('Error updating caption:', error);
      toast({
        title: "Error",
        description: "Failed to update caption.",
        variant: "destructive",
      });
    }
  };

  const togglePin = async (item: MediaItem) => {
    if (!user) return;

    try {
      const pinnedCount = mediaItems.filter(i => i.isPinned).length;
      
      if (!item.isPinned && pinnedCount >= 3) {
        toast({
          title: "Limit reached",
          description: "You can only pin up to 3 images.",
          variant: "destructive",
        });
        return;
      }

      // Check if portfolio item exists
      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        // Update existing
        const { error } = await supabase
          .from('portfolio_items')
          .update({ featured: !item.isPinned })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Create new portfolio item
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: user.id,
            title: item.filename.replace(/\.[^/.]+$/, ""),
            description: item.caption,
            image_url: item.url,
            category: item.category,
            featured: true
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Image ${item.isPinned ? 'unpinned' : 'pinned'} successfully!`,
      });

      fetchMediaItems();
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast({
        title: "Error",
        description: "Failed to update pin status.",
        variant: "destructive",
      });
    }
  };

  const setCoverImage = async (item: MediaItem) => {
    if (!user) return;

    try {
      // Remove cover status from all other images
      await supabase
        .from('portfolio_items')
        .update({ template_type: null })
        .eq('provider_id', user.id)
        .eq('template_type', 'cover');

      // Check if portfolio item exists
      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        // Update existing
        const { error } = await supabase
          .from('portfolio_items')
          .update({ template_type: item.isCover ? null : 'cover' })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Create new portfolio item
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: user.id,
            title: item.filename.replace(/\.[^/.]+$/, ""),
            description: item.caption,
            image_url: item.url,
            category: item.category,
            template_type: 'cover'
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: item.isCover ? "Cover image removed!" : "Cover image set successfully!",
      });

      fetchMediaItems();
    } catch (error) {
      console.error('Error setting cover:', error);
      toast({
        title: "Error",
        description: "Failed to set cover image.",
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (item: MediaItem) => {
    if (!user) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('portfolio')
        .remove([`${user.id}/media-library/${item.filename}`]);

      if (storageError) throw storageError;

      // Delete from portfolio_items if exists
      await supabase
        .from('portfolio_items')
        .delete()
        .eq('provider_id', user.id)
        .eq('image_url', item.url);

      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });

      fetchMediaItems();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                Media Library
              </h1>
              <p className="text-muted-foreground">
                Manage your business portfolio images
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-provider border-provider">
              {mediaItems.length} images
            </Badge>
            <Badge variant="outline" className="text-provider border-provider">
              {mediaItems.filter(item => item.isPinned).length}/3 pinned
            </Badge>
          </div>
        </div>

        {/* Upload Area */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-provider bg-provider/5' 
                  : 'border-border hover:border-provider/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-provider/10">
                  <Upload className="h-8 w-8 text-provider" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {uploading ? 'Uploading...' : 'Upload Images'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop images here, or click to browse
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    variant="provider"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Choose Images'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supports JPG, PNG, WebP up to 10MB each
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Gallery */}
        {mediaItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No images yet</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Start building your media library by uploading your first images. 
                You can organize them, add captions, and pin your favorites.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {mediaItems.map((item) => (
              <Card key={item.id} className="break-inside-avoid overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative group">
                  <img
                    src={item.url}
                    alt={item.caption || item.filename}
                    className="w-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col space-y-2">
                    {item.isPinned && (
                      <Badge className="bg-provider text-white">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                    {item.isCover && (
                      <Badge className="bg-yellow-500 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Cover
                      </Badge>
                    )}
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => setSelectedImage(item)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => {
                          setEditingItem(item.id);
                          setEditCaption(item.caption);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={item.isPinned ? "provider" : "outline"}
                        className={item.isPinned ? "" : "bg-white/90 hover:bg-white"}
                        onClick={() => togglePin(item)}
                      >
                        <Pin className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={item.isCover ? "default" : "outline"}
                        className={item.isCover ? "bg-yellow-500 hover:bg-yellow-600" : "bg-white/90 hover:bg-white"}
                        onClick={() => setCoverImage(item)}
                      >
                        <Crown className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteImage(item)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  {editingItem === item.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editCaption}
                        onChange={(e) => setEditCaption(e.target.value)}
                        placeholder="Add a caption..."
                        className="resize-none"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="provider"
                          onClick={() => {
                            updateCaption(item, editCaption);
                            setEditingItem(null);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-medium text-sm mb-1 truncate">
                        {item.filename}
                      </h4>
                      {item.caption && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.caption}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(item.size)}</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-full">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || selectedImage.filename}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              {selectedImage.caption && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
                  <p>{selectedImage.caption}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessMediaLibrary;