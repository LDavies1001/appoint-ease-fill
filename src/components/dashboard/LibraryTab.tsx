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
  Image, 
  EyeOff, 
  Building, 
  FolderOpen, 
  X, 
  Edit, 
  Pin, 
  Star, 
  Trash2, 
  Crown,
  Eye
} from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  caption: string;
  category: string;
  isPinned: boolean;
  isCover: boolean;
  show_in_portfolio: boolean;
  created_at: string;
  size: number;
  folder: string;
}

const LibraryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('all'); // 'all', 'business-logos', 'uploaded-images'

  useEffect(() => {
    fetchMediaItems();
  }, [user]);

  const fetchMediaItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allItems: MediaItem[] = [];
      
      // Fetch business logos
      const { data: logoFiles, error: logoError } = await supabase.storage
        .from('business-photos')
        .list(`${user.id}/business-logos`, { limit: 100 });

      if (logoError) throw logoError;

      const logoItems = await Promise.all(
        (logoFiles || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('business-photos')
            .getPublicUrl(`${user.id}/business-logos/${file.name}`);
          
          return {
            id: file.id || file.name,
            filename: file.name,
            url: urlData.publicUrl,
            folder: 'business-logos',
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            caption: '',
            category: 'Business Logo',
            isPinned: false,
            isCover: false,
            show_in_portfolio: false
          };
        })
      );

      // Fetch uploaded images from media library
      const { data: mediaFiles, error: mediaError } = await supabase.storage
        .from('portfolio')
        .list(`${user.id}/media-library`, { limit: 100 });

      if (mediaError) throw mediaError;

      const mediaLibraryItems = await Promise.all(
        (mediaFiles || []).map(async (file) => {
          const { data: urlData } = supabase.storage
            .from('portfolio')
            .getPublicUrl(`${user.id}/media-library/${file.name}`);
          
          return {
            id: file.id || file.name,
            filename: file.name,
            url: urlData.publicUrl,
            folder: 'uploaded-images',
            size: file.metadata?.size || 0,
            created_at: file.created_at || new Date().toISOString(),
            caption: '',
            category: 'General',
            isPinned: false,
            isCover: false,
            show_in_portfolio: false
          };
        })
      );

      allItems.push(...logoItems, ...mediaLibraryItems);

      // Check which images are in portfolio and get their metadata
      const { data: portfolioItems } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user.id);

      const portfolioMap = new Map(portfolioItems?.map(item => [item.image_url, item]) || []);

      const enrichedItems = allItems.map(item => {
        const portfolioData = portfolioMap.get(item.url);
        return {
          ...item,
          caption: portfolioData?.description || '',
          isPinned: portfolioData?.featured || false,
          isCover: portfolioData?.template_type === 'cover' || false,
          show_in_portfolio: !!portfolioData,
          category: portfolioData?.category || item.category
        };
      });

      // Sort: pinned first, then cover, then by date
      const sortedItems = enrichedItems.sort((a, b) => {
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

  const handleDrop = useCallback((e: React.DragEvent, targetFolder: string) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files, targetFolder);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileUpload = async (files: FileList, folder: string) => {
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
        const bucket = folder === 'business-logos' ? 'business-photos' : 'portfolio';
        const folderPath = folder === 'business-logos' ? 'business-logos' : 'media-library';
        const filePath = `${user.id}/${folderPath}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
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

  const updateCaption = async (item: MediaItem, newCaption: string) => {
    if (!user) return;

    try {
      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        const { error } = await supabase
          .from('portfolio_items')
          .update({ description: newCaption })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
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

      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        const { error } = await supabase
          .from('portfolio_items')
          .update({ featured: !item.isPinned })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
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

      const { data: existingItem } = await supabase
        .from('portfolio_items')
        .select('id')
        .eq('provider_id', user.id)
        .eq('image_url', item.url)
        .single();

      if (existingItem) {
        const { error } = await supabase
          .from('portfolio_items')
          .update({ template_type: item.isCover ? null : 'cover' })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
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

  const togglePortfolioDisplay = async (item: MediaItem) => {
    if (!user) return;

    try {
      if (item.show_in_portfolio) {
        const { error } = await supabase
          .from('portfolio_items')
          .delete()
          .eq('provider_id', user.id)
          .eq('image_url', item.url);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('portfolio_items')
          .insert({
            provider_id: user.id,
            title: item.filename.replace(/\.[^/.]+$/, ""),
            image_url: item.url,
            category: item.category,
            description: item.caption || ''
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Image ${item.show_in_portfolio ? 'removed from' : 'added to'} portfolio!`,
      });

      fetchMediaItems();
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast({
        title: "Error",
        description: "Failed to update portfolio.",
        variant: "destructive",
      });
    }
  };

  const deleteImage = async (item: MediaItem) => {
    if (!user) return;

    try {
      const bucket = item.folder === 'business-logos' ? 'business-photos' : 'portfolio';
      const folderPath = item.folder === 'business-logos' ? 'business-logos' : 'media-library';
      const filePath = `${user.id}/${folderPath}/${item.filename}`;

      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) throw storageError;

      if (item.show_in_portfolio) {
        await supabase
          .from('portfolio_items')
          .delete()
          .eq('provider_id', user.id)
          .eq('image_url', item.url);
      }

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

  const filteredItems = activeFolder === 'all' 
    ? mediaItems 
    : mediaItems.filter(item => item.folder === activeFolder);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
            My Portfolio
          </h2>
          <p className="text-muted-foreground">
            Manage your business portfolio images and media
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-provider border-provider">
            {mediaItems.length} images
          </Badge>
          <Badge variant="outline" className="text-provider border-provider">
            {mediaItems.filter(item => item.isPinned).length}/3 pinned
          </Badge>
          <Badge variant="outline" className="text-provider border-provider">
            {mediaItems.filter(item => item.show_in_portfolio).length} in portfolio
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        <Button
          variant={activeFolder === 'all' ? 'provider' : 'outline'}
          size="sm"
          onClick={() => setActiveFolder('all')}
        >
          All Images ({mediaItems.length})
        </Button>
        <Button
          variant={activeFolder === 'business-logos' ? 'provider' : 'outline'}
          size="sm"
          onClick={() => setActiveFolder('business-logos')}
        >
          <Building className="h-3 w-3 mr-1" />
          Business Logos ({mediaItems.filter(i => i.folder === 'business-logos').length})
        </Button>
        <Button
          variant={activeFolder === 'uploaded-images' ? 'provider' : 'outline'}
          size="sm"
          onClick={() => setActiveFolder('uploaded-images')}
        >
          <FolderOpen className="h-3 w-3 mr-1" />
          Media Library ({mediaItems.filter(i => i.folder === 'uploaded-images').length})
        </Button>
      </div>

      {/* Upload Area */}
      <Card className="card-elegant">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Logos Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-provider bg-provider/5' : 'border-border hover:border-provider/50'
              }`}
              onDrop={(e) => handleDrop(e, 'business-logos')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Building className="h-8 w-8 text-provider mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Business Logos</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload your company logos and branding
              </p>
              <input
                type="file"
                id="logo-upload"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'business-logos')}
                className="hidden"
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-3 w-3 mr-2" />
                Upload Logos
              </Button>
            </div>

            {/* Media Library Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-provider bg-provider/5' : 'border-border hover:border-provider/50'
              }`}
              onDrop={(e) => handleDrop(e, 'uploaded-images')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FolderOpen className="h-8 w-8 text-provider mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Media Library</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload images to showcase your services
              </p>
              <input
                type="file"
                id="media-upload"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'uploaded-images')}
                className="hidden"
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('media-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-3 w-3 mr-2" />
                Upload Media
              </Button>
            </div>
          </div>
          
          {uploading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-provider"></div>
                <span className="text-sm text-muted-foreground">Uploading images...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {filteredItems.length === 0 ? (
        <Card className="card-elegant">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Image className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {activeFolder === 'all' 
                ? 'No images yet' 
                : `No ${activeFolder === 'business-logos' ? 'business logos' : 'media library images'} yet`
              }
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {activeFolder === 'all'
                ? 'Start building your portfolio by uploading your first images.'
                : `Upload ${activeFolder === 'business-logos' ? 'your company logos and branding materials' : 'portfolio images and media'} to get started.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredItems.map((item) => (
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
                    <Badge className="bg-provider text-white text-xs">
                      <Pin className="h-2 w-2 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {item.isCover && (
                    <Badge className="bg-yellow-500 text-white text-xs">
                      <Crown className="h-2 w-2 mr-1" />
                      Cover
                    </Badge>
                  )}
                  {item.show_in_portfolio && (
                    <Badge className="bg-green-500 text-white text-xs">
                      <Eye className="h-2 w-2 mr-1" />
                      Portfolio
                    </Badge>
                  )}
                </div>

                {/* Controls Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-2 p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 hover:bg-white text-xs flex items-center gap-1"
                      onClick={() => setSelectedImage(item)}
                    >
                      <Eye className="h-3 w-3" />
                      <span>View</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 hover:bg-white text-xs flex items-center gap-1"
                      onClick={() => {
                        setEditingItem(item.id);
                        setEditCaption(item.caption);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={item.isPinned ? "provider" : "outline"}
                      className={item.isPinned ? "text-xs flex items-center gap-1" : "bg-white/90 hover:bg-white text-xs flex items-center gap-1"}
                      onClick={() => togglePin(item)}
                    >
                      <Pin className="h-3 w-3" />
                      <span>{item.isPinned ? "Unpin" : "Pin"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={item.isCover ? "default" : "outline"}
                      className={item.isCover ? "bg-yellow-500 hover:bg-yellow-600 text-xs flex items-center gap-1" : "bg-white/90 hover:bg-white text-xs flex items-center gap-1"}
                      onClick={() => setCoverImage(item)}
                    >
                      <Crown className="h-3 w-3" />
                      <span>{item.isCover ? "Cover" : "Set Cover"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant={item.show_in_portfolio ? "default" : "outline"}
                      className={item.show_in_portfolio ? "bg-green-500 hover:bg-green-600 text-xs flex items-center gap-1" : "bg-white/90 hover:bg-white text-xs flex items-center gap-1"}
                      onClick={() => togglePortfolioDisplay(item)}
                    >
                      {item.show_in_portfolio ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      <span>{item.show_in_portfolio ? "Hide" : "Show"}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs flex items-center gap-1"
                      onClick={() => deleteImage(item)}
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Delete</span>
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
                      <span>{item.folder === 'business-logos' ? 'Logo' : 'Media'}</span>
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
  );
};

export default LibraryTab;