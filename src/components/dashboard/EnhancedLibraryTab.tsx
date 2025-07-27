import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getGridClasses } from '@/lib/image-utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Image, 
  Star, 
  Trash2, 
  Eye,
  Grid3X3,
  List,
  Filter,
  Search,
  Plus,
  ExternalLink,
  Palette,
  FolderOpen,
  Building,
  Folder,
  FolderPlus
} from 'lucide-react';
import ImageDropzone from './ImageDropzone';
import ImageCard from './ImageCard';
import FolderDropZone from './FolderDropZone';
import { UploadedImage } from '@/hooks/useImageLibrary';

interface MediaItem extends UploadedImage {
  id: string;
  filename: string;
  caption?: string;
  category?: string;
  isPinned?: boolean;
  show_in_portfolio?: boolean;
}

const EnhancedLibraryTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showFolderDropZones, setShowFolderDropZones] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  
  // Constants
  const categories = ['all', 'portraits', 'nails', 'hair', 'makeup', 'lashes', 'brows', 'other'];
  const buckets = ['all', 'portfolio', 'business-photos', 'profile-photos'];

  useEffect(() => {
    fetchMediaItems();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [mediaItems, searchQuery, selectedCategory, selectedBucket, selectedFolder]);

  const fetchMediaItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allItems: MediaItem[] = [];
      const allFolders = new Set<string>();
      
      const bucketList = ['portfolio', 'business-photos', 'profile-photos'];
      
      for (const bucket of bucketList) {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list(user.id, { limit: 100 });

        if (error) {
          console.error(`Error fetching from ${bucket}:`, error);
          continue;
        }

        if (files) {
          const bucketItems = files
            .filter(file => file.name !== '.emptyFolderPlaceholder')
            .map(file => {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(`${user.id}/${file.name}`);
              
              // Extract folder from path if it contains '/'
              const pathParts = file.name.split('/');
              const folder = pathParts.length > 1 ? pathParts[0] : '';
              const filename = pathParts[pathParts.length - 1];
              
              if (folder) {
                allFolders.add(folder);
              }
              
              return {
                id: `${bucket}-${file.name}`,
                name: filename,
                filename: filename,
                url: publicUrl,
                bucket,
                folder,
                fullPath: file.name,
                size: file.metadata?.size,
                created_at: file.created_at,
                caption: '',
                category: 'other',
                isPinned: false,
                show_in_portfolio: bucket === 'portfolio'
              } as MediaItem & { folder: string; fullPath: string };
            });
          
          allItems.push(...bucketItems);
        }
      }

      setFolders(Array.from(allFolders).sort());
      setMediaItems(allItems);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: "Error loading images",
        description: "Could not load your image library",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...mediaItems];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caption?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by bucket
    if (selectedBucket !== 'all') {
      filtered = filtered.filter(item => item.bucket === selectedBucket);
    }

    // Filter by folder
    if (selectedFolder !== 'all') {
      if (selectedFolder === 'none') {
        // Show only items without folders
        filtered = filtered.filter(item => 
          !(item as any).folder || (item as any).folder === ''
        );
      } else {
        // Show items in specific folder
        filtered = filtered.filter(item => 
          (item as any).folder === selectedFolder
        );
      }
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    setFilteredItems(filtered);
  };

  const handleDelete = async (image: UploadedImage) => {
    try {
      const fullPath = (image as any).fullPath || image.name;
      const filePath = `${user?.id}/${fullPath}`;
      
      const { error } = await supabase.storage
        .from(image.bucket)
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "Image deleted successfully",
      });
      
      fetchMediaItems();
    } catch (error: any) {
      toast({
        title: "Error deleting image",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRename = async (image: UploadedImage, newName: string) => {
    try {
      const oldPath = `${user?.id}/${(image as any).fullPath || image.name}`;
      const folder = (image as any).folder || '';
      const newPath = `${user?.id}/${folder ? folder + '/' : ''}${newName}`;
      
      // Copy file to new path
      const { error: copyError } = await supabase.storage
        .from(image.bucket)
        .copy(oldPath, newPath);

      if (copyError) throw copyError;

      // Delete old file
      const { error: deleteError } = await supabase.storage
        .from(image.bucket)
        .remove([oldPath]);

      if (deleteError) throw deleteError;

      toast({
        title: "Image renamed successfully",
      });
      
      fetchMediaItems();
    } catch (error: any) {
      toast({
        title: "Error renaming image",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTogglePortfolio = async (image: UploadedImage) => {
    // This would be implemented with a database table to track portfolio status
    toast({
      title: "Portfolio toggle",
      description: "Portfolio management coming soon!",
    });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      // Create a placeholder file in the new folder to ensure it exists
      const placeholderPath = `${user?.id}/${newFolderName}/.emptyFolderPlaceholder`;
      
      const { error } = await supabase.storage
        .from('portfolio')
        .upload(placeholderPath, new Blob([''], { type: 'text/plain' }));

      if (error && !error.message.includes('already exists')) throw error;

      toast({
        title: "Folder created successfully",
      });
      
      setNewFolderName('');
      setShowCreateFolder(false);
      fetchMediaItems();
    } catch (error: any) {
      toast({
        title: "Error creating folder",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMoveToFolder = async (image: UploadedImage, targetFolder: string) => {
    try {
      const currentFolder = (image as any).folder || '';
      const oldPath = `${user?.id}/${(image as any).fullPath || image.name}`;
      
      // Determine new path based on target folder
      let newPath: string;
      if (targetFolder === 'none') {
        // Moving to root (no folder)
        newPath = `${user?.id}/${image.name}`;
      } else {
        // Moving to specific folder
        newPath = `${user?.id}/${targetFolder}/${image.name}`;
      }

      // Skip if moving to same location
      if (oldPath === newPath) {
        toast({
          title: "Image is already in this location",
        });
        return;
      }

      // Copy file to new path
      const { error: copyError } = await supabase.storage
        .from(image.bucket)
        .copy(oldPath, newPath);

      if (copyError) throw copyError;

      // Delete old file
      const { error: deleteError } = await supabase.storage
        .from(image.bucket)
        .remove([oldPath]);

      if (deleteError) throw deleteError;

      toast({
        title: "Image moved successfully",
        description: `Moved to ${targetFolder === 'none' ? 'root folder' : targetFolder}`,
      });
      
      fetchMediaItems();
      setShowFolderDropZones(false);
    } catch (error: any) {
      toast({
        title: "Error moving image",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatBucketName = (bucket: string) => {
    switch (bucket) {
      case 'profile-photos': return 'Profile Pictures';
      case 'business-photos': return 'Business Photos';
      case 'portfolio': return 'Portfolio';
      default: return bucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getImageStats = () => {
    const total = mediaItems.length;
    const portfolio = mediaItems.filter(item => item.show_in_portfolio).length;
    const pinned = mediaItems.filter(item => item.isPinned).length;
    
    return { total, portfolio, pinned };
  };

  const getFolderImageCount = (folderName: string) => {
    if (folderName === 'none') {
      return mediaItems.filter(item => !(item as any).folder || (item as any).folder === '').length;
    }
    return mediaItems.filter(item => (item as any).folder === folderName).length;
  };

  const stats = getImageStats();

  // Handle global drag events
  React.useEffect(() => {
    const handleDragStart = () => setShowFolderDropZones(true);
    const handleDragEnd = () => {
      setShowFolderDropZones(false);
      setDraggingImageId(null);
    };

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg"></div>
          ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-provider" />
            Image Library Manager
          </h2>
          <p className="text-muted-foreground mt-1">
            Upload and manage your professional portfolio images
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <Badge variant="outline" className="text-provider border-provider">
            {stats.total} total images
          </Badge>
          <Badge variant="outline" className="text-provider border-provider">
            {stats.portfolio} in portfolio
          </Badge>
          
          <Button
            variant="outline"
            onClick={() => navigate('/profile#portfolio')}
            className="border-provider/20 hover:border-provider text-provider"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Portfolio
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="card-elegant">
        <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-provider" />
            Upload New Images
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Folder Selection */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder} value={folder}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowCreateFolder(true)}
                className="border-provider/20 hover:border-provider text-provider"
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>

            {/* Create Folder Input */}
            {showCreateFolder && (
              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolder();
                    if (e.key === 'Escape') setShowCreateFolder(false);
                  }}
                />
                <Button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                  className="bg-provider hover:bg-provider-dark"
                >
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateFolder(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            <ImageDropzone 
              onUploadComplete={fetchMediaItems}
              bucket="portfolio"
              folder={selectedFolder === 'none' ? '' : selectedFolder}
              maxFiles={10}
              maxSizeInMB={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters and Controls */}
      <Card className="card-elegant">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Buckets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buckets</SelectItem>
                  {buckets.slice(1).map(bucket => (
                    <SelectItem key={bucket} value={bucket}>
                      {formatBucketName(bucket)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map(folder => (
                    <SelectItem key={folder} value={folder}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-3 w-3" />
                        {folder}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'provider' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'provider' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Folder Drop Zones - Show when dragging */}
      {showFolderDropZones && (
        <Card className="card-elegant bg-gradient-to-r from-provider/5 to-provider/10">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-provider" />
              Drop image into folder
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* No folder option */}
              <FolderDropZone
                folderName="none"
                onDrop={handleMoveToFolder}
                imageCount={getFolderImageCount('none')}
              />
              
              {/* Existing folders */}
              {folders.map(folder => (
                <FolderDropZone
                  key={folder}
                  folderName={folder}
                  onDrop={handleMoveToFolder}
                  imageCount={getFolderImageCount(folder)}
                  isActive={selectedFolder === folder}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Gallery */}
      <Card className="card-elegant">
        <CardContent className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No images found</h3>
              <p className="text-muted-foreground mb-6">
                {mediaItems.length === 0 
                  ? "Upload your first image to get started" 
                  : "Try adjusting your search or filters"
                }
              </p>
              {mediaItems.length === 0 && (
                <Button variant="provider">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              )}
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? getGridClasses('gallery')
                : "space-y-3"
            }>
              {filteredItems.map((item) => (
                <ImageCard
                  key={item.id}
                  image={item}
                  onDelete={handleDelete}
                  onTogglePortfolio={handleTogglePortfolio}
                  onRename={handleRename}
                  onMoveToFolder={handleMoveToFolder}
                  showBucket={true}
                  showActions={true}
                  viewMode={viewMode}
                  isDragging={draggingImageId === item.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      {filteredItems.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredItems.length} of {mediaItems.length} images
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}
    </div>
  );
};

export default EnhancedLibraryTab;