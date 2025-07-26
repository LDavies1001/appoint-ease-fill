import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Building
} from 'lucide-react';
import ImageDropzone from './ImageDropzone';
import ImageCard from './ImageCard';
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
  
  // Constants
  const categories = ['all', 'portraits', 'nails', 'hair', 'makeup', 'lashes', 'brows', 'other'];
  const buckets = ['all', 'portfolio', 'business-photos', 'profile-photos'];

  useEffect(() => {
    fetchMediaItems();
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [mediaItems, searchQuery, selectedCategory, selectedBucket]);

  const fetchMediaItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allItems: MediaItem[] = [];
      
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
              
              return {
                id: `${bucket}-${file.name}`,
                name: file.name,
                filename: file.name,
                url: publicUrl,
                bucket,
                size: file.metadata?.size,
                created_at: file.created_at,
                caption: '',
                category: 'other',
                isPinned: false,
                show_in_portfolio: bucket === 'portfolio'
              } as MediaItem;
            });
          
          allItems.push(...bucketItems);
        }
      }

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
      const filePath = `${user?.id}/${image.name}`;
      
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

  const handleTogglePortfolio = async (image: UploadedImage) => {
    // This would be implemented with a database table to track portfolio status
    toast({
      title: "Portfolio toggle",
      description: "Portfolio management coming soon!",
    });
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

  const stats = getImageStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <ImageDropzone 
            onUploadComplete={fetchMediaItems}
            bucket="portfolio"
            maxFiles={10}
            maxSizeInMB={5}
          />
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
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
                : "space-y-4"
            }>
              {filteredItems.map((item) => (
                <ImageCard
                  key={item.id}
                  image={item}
                  onDelete={handleDelete}
                  onTogglePortfolio={handleTogglePortfolio}
                  showBucket={true}
                  showActions={true}
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