import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Eye,
  MoreVertical,
  Check,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  caption: string;
  category: string;
  isPinned: boolean;
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
          show_in_portfolio: !!portfolioData,
          category: portfolioData?.category || item.category
        };
      });

      // Sort: pinned first, then by date
      const sortedItems = enrichedItems.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
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

  const saveCaption = async (itemId: string) => {
    const item = mediaItems.find(i => i.id === itemId);
    if (!item) return;
    
    await updateCaption(item, editCaption);
    setEditingItem(null);
    setEditCaption('');
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
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
          
          <Button
            variant="outline"
            onClick={() => window.open(`/portfolio/${user?.id}`, '_blank')}
            className="border-provider/20 hover:border-provider text-provider"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Portfolio
          </Button>
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
                {/* Fixed aspect ratio container */}
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={item.url}
                    alt={item.caption || item.filename}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setSelectedImage(item)}
                  />
                </div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {item.isPinned && (
                    <Badge className="bg-provider text-white text-xs">
                      <Pin className="h-2 w-2 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {item.show_in_portfolio && (
                    <Badge className="bg-green-500 text-white text-xs">
                      <Eye className="h-2 w-2 mr-1" />
                      Portfolio
                    </Badge>
                  )}
                </div>

                {/* Interactive Controls */}
                <TooltipProvider>
                  {/* Quick actions bar at bottom - always visible */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={item.show_in_portfolio ? "provider" : "outline"}
                              className={`h-8 w-8 p-0 ${item.show_in_portfolio ? "" : "bg-white/90 hover:bg-white text-gray-800"}`}
                              onClick={() => togglePortfolioDisplay(item)}
                            >
                              {item.show_in_portfolio ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.show_in_portfolio ? "Remove from portfolio" : "Add to portfolio"}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={item.isPinned ? "provider" : "outline"}
                              className={`h-8 w-8 p-0 ${item.isPinned ? "" : "bg-white/90 hover:bg-white text-gray-800"}`}
                              onClick={() => togglePin(item)}
                            >
                              <Pin className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.isPinned ? "Unpin image" : "Pin to featured"}</p>
                          </TooltipContent>
                        </Tooltip>

                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-800"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => setSelectedImage(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Full Size
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setEditingItem(item.id);
                            setEditCaption(item.caption);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Caption
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Image
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.filename}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteImage(item)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                </TooltipProvider>
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
                    {/* Editable Caption */}
                    {editingItem === item.id ? (
                      <div className="mb-2">
                        <Input
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Add a caption..."
                          className="text-sm h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateCaption(item, editCaption);
                              setEditingItem(null);
                            } else if (e.key === 'Escape') {
                              setEditingItem(null);
                              setEditCaption('');
                            }
                          }}
                          onBlur={() => {
                            updateCaption(item, editCaption);
                            setEditingItem(null);
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div 
                        className="mb-2 cursor-pointer hover:bg-muted/50 rounded px-1 py-1 -mx-1 transition-colors group/caption min-h-[40px] flex items-center"
                        onClick={() => {
                          setEditingItem(item.id);
                          setEditCaption(item.caption || '');
                        }}
                        title="Click to edit caption"
                      >
                        {item.caption ? (
                          <p className="text-sm text-foreground group-hover/caption:text-foreground font-medium">
                            {item.caption}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic group-hover/caption:text-muted-foreground">
                            Click to add caption...
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
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

      {/* Enhanced Fullscreen Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 overflow-hidden">
          {selectedImage && (
            <div className="flex h-full">
              {/* Image Display Area */}
              <div className="flex-1 relative bg-black flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.caption || selectedImage.filename}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Image Navigation/Controls Overlay */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={selectedImage.show_in_portfolio ? "provider" : "outline"}
                            className={`${selectedImage.show_in_portfolio ? "" : "bg-white/90 hover:bg-white text-gray-800"}`}
                            onClick={() => togglePortfolioDisplay(selectedImage)}
                          >
                            {selectedImage.show_in_portfolio ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedImage.show_in_portfolio ? "Remove from portfolio" : "Add to portfolio"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant={selectedImage.isPinned ? "provider" : "outline"}
                            className={`${selectedImage.isPinned ? "" : "bg-white/90 hover:bg-white text-gray-800"}`}
                            onClick={() => togglePin(selectedImage)}
                          >
                            <Pin className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{selectedImage.isPinned ? "Unpin image" : "Pin to featured"}</p>
                        </TooltipContent>
                      </Tooltip>

                    </TooltipProvider>
                  </div>
                </div>

                {/* Caption Overlay */}
                {selectedImage.caption && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-4 rounded-lg">
                    <p>{selectedImage.caption}</p>
                  </div>
                )}
              </div>

              {/* Side Panel with Image Details and Controls */}
              <div className="w-80 bg-background border-l flex flex-col">
                <DialogHeader className="p-6 border-b">
                  <DialogTitle className="text-lg font-semibold">Image Details</DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Filename</Label>
                      <p className="text-sm font-medium break-all">{selectedImage.filename}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Size</Label>
                      <p className="text-sm">{(selectedImage.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                      <p className="text-sm capitalize">{selectedImage.category.replace('-', ' ')}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Uploaded</Label>
                      <p className="text-sm">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Caption Editor */}
                  <div className="space-y-2">
                    <Label htmlFor="modal-caption" className="text-sm font-medium">Caption</Label>
                    <Textarea
                      id="modal-caption"
                      value={editingItem === selectedImage.id ? editCaption : selectedImage.caption}
                      onChange={(e) => {
                        if (editingItem !== selectedImage.id) {
                          setEditingItem(selectedImage.id);
                          setEditCaption(e.target.value);
                        } else {
                          setEditCaption(e.target.value);
                        }
                      }}
                      placeholder="Add a caption to describe this image..."
                      className="min-h-[80px] resize-none"
                    />
                    {editingItem === selectedImage.id && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => saveCaption(selectedImage.id)}
                          className="flex-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingItem(null);
                            setEditCaption('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Status Indicators */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Portfolio Visibility</span>
                      <Badge variant={selectedImage.show_in_portfolio ? "default" : "secondary"}>
                        {selectedImage.show_in_portfolio ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pinned</span>
                      <Badge variant={selectedImage.isPinned ? "default" : "secondary"}>
                        {selectedImage.isPinned ? "Yes" : "No"}
                      </Badge>
                    </div>
                    
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingItem(selectedImage.id);
                      setEditCaption(selectedImage.caption);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Caption
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Image
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{selectedImage.filename}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteImage(selectedImage);
                            setSelectedImage(null);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LibraryTab;