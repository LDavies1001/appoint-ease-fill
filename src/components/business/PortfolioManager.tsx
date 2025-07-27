import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Star, StarOff, Upload, Share2, Copy, CheckCircle, Search, Filter, Eye, Globe, Lock, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageCropUpload } from '@/components/ui/image-crop-upload';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
  tags: string[];
  is_public: boolean;
  public_slug: string | null;
  view_count: number;
  template_type: string | null;
}

const PortfolioManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PortfolioItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    featured: false,
    image_url: '',
    tags: [] as string[],
    is_public: false,
    template_type: null as string | null
  });

  const [tagInput, setTagInput] = useState('');

  const portfolioTemplates = [
    { id: 'classic', name: 'Classic Grid', description: 'Traditional grid layout' },
    { id: 'masonry', name: 'Masonry', description: 'Pinterest-style layout' },
    { id: 'showcase', name: 'Showcase', description: 'Large featured images' },
    { id: 'minimal', name: 'Minimal', description: 'Clean and simple' }
  ];

  useEffect(() => {
    if (user) {
      fetchPortfolioItems();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, selectedCategory]);

  const applyFilters = () => {
    let filtered = items;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setFilteredItems(filtered);
  };

  const fetchPortfolioItems = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching portfolio items:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio items.",
        variant: "destructive",
      });
    }
  };

  const handlePortfolioImageUpload = async (url: string) => {
    setFormData({ ...formData, image_url: url });
    
    toast({
      title: "Image uploaded",
      description: "Your portfolio image has been processed and is ready to use."
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.image_url) return;

    setIsLoading(true);
    try {
      const portfolioData = {
        ...formData,
        provider_id: user.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('portfolio_items')
          .update(portfolioData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Portfolio item updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('portfolio_items')
          .insert([portfolioData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Portfolio item added successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      toast({
        title: "Error",
        description: "Failed to save portfolio item.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Portfolio item deleted successfully.",
      });
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error deleting portfolio item:', error);
      toast({
        title: "Error",
        description: "Failed to delete portfolio item.",
        variant: "destructive",
      });
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .update({ featured: !item.featured })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Portfolio item ${!item.featured ? 'featured' : 'unfeatured'}.`,
      });
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      featured: false,
      image_url: '',
      tags: [],
      is_public: false,
      template_type: null
    });
    setTagInput('');
    setEditingItem(null);
  };

  const handleEdit = (item: PortfolioItem) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      featured: item.featured,
      image_url: item.image_url,
      tags: item.tags || [],
      is_public: item.is_public || false,
      template_type: item.template_type
    });
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  
  const handleShare = async (item: PortfolioItem) => {
    if (!item.is_public) {
      // Make item public first
      try {
        const { error } = await supabase
          .from('portfolio_items')
          .update({ is_public: true })
          .eq('id', item.id);

        if (error) throw error;
        
        // Refresh data to get the generated slug
        await fetchPortfolioItems();
        
        toast({
          title: "Success",
          description: "Portfolio item is now public and shareable.",
        });
      } catch (error) {
        console.error('Error making item public:', error);
        toast({
          title: "Error",
          description: "Failed to make item public.",
          variant: "destructive",
        });
      }
    } else {
      // Copy share link
      const shareUrl = `${window.location.origin}/portfolio/${user?.id}?item=${item.public_slug}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Portfolio item link copied to clipboard.",
      });
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(filteredItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const bulkDelete = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast({
        title: "Success",
        description: `Deleted ${selectedItems.size} portfolio items.`,
      });
      
      setSelectedItems(new Set());
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error bulk deleting items:', error);
      toast({
        title: "Error",
        description: "Failed to delete selected items.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkToggleFeatured = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      // Toggle featured status for all selected items
      const selectedItemsData = items.filter(item => selectedItems.has(item.id));
      const updates = selectedItemsData.map(item => 
        supabase
          .from('portfolio_items')
          .update({ featured: !item.featured })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `Updated featured status for ${selectedItems.size} items.`,
      });
      
      setSelectedItems(new Set());
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error bulk updating featured status:', error);
      toast({
        title: "Error",
        description: "Failed to update selected items.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const bulkTogglePublic = async () => {
    if (selectedItems.size === 0) return;

    setBulkActionLoading(true);
    try {
      const selectedItemsData = items.filter(item => selectedItems.has(item.id));
      const updates = selectedItemsData.map(item => 
        supabase
          .from('portfolio_items')
          .update({ is_public: !item.is_public })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `Updated public status for ${selectedItems.size} items.`,
      });
      
      setSelectedItems(new Set());
      fetchPortfolioItems();
    } catch (error) {
      console.error('Error bulk updating public status:', error);
      toast({
        title: "Error",
        description: "Failed to update selected items.",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Get unique categories from items
  const categories = ['all', ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))];
  const allTags = Array.from(new Set(items.flatMap(item => item.tags || [])));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Portfolio</h2>
          <p className="text-muted-foreground">Showcase your work to potential customers</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search portfolio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Classic Eyelash Extensions"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Lash Extensions"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template">Template</Label>
                    <Select 
                      value={formData.template_type || ''} 
                      onValueChange={(value) => setFormData({ ...formData, template_type: value || null })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Template</SelectItem>
                        {portfolioTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this work..."
                    rows={3}
                  />
                </div>

                {/* Tags Section */}
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Portfolio Image *</Label>
                  <div className="mt-2">
                    <ImageCropUpload
                      onUpload={handlePortfolioImageUpload}
                      bucket="portfolio"
                      folder="items"
                      aspectRatio={1} // Square aspect ratio for portfolio items
                      title="Upload Portfolio Image"
                      description="Upload and crop your portfolio image. Square format works best for portfolio grids."
                    >
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload and crop portfolio image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Square format recommended, max 10MB
                        </p>
                      </div>
                    </ImageCropUpload>
                    
                    {formData.image_url && (
                      <div className="mt-3 relative">
                        <img 
                          src={formData.image_url} 
                          alt="Portfolio preview" 
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData({ ...formData, image_url: '' })}
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
                    />
                    <Label htmlFor="featured">Featured item</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_public: !!checked })}
                    />
                    <Label htmlFor="public">Make publicly shareable</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading || uploadingImage || !formData.image_url}
                  >
                    {isLoading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.size > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={bulkToggleFeatured}
                disabled={bulkActionLoading}
              >
                <Star className="h-3 w-3 mr-1" />
                Toggle Featured
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={bulkTogglePublic}
                disabled={bulkActionLoading}
              >
                <Globe className="h-3 w-3 mr-1" />
                Toggle Public
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={bulkDelete}
                disabled={bulkActionLoading}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Select All Button */}
      {filteredItems.length > 0 && (
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={selectAllItems}>
            Select All ({filteredItems.length})
          </Button>
          <p className="text-sm text-muted-foreground">
            Showing {filteredItems.length} of {items.length} items
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start showcasing your work by adding your first portfolio item.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Try adjusting your search terms or filters.
            </p>
            <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    className="bg-white/80 border-white"
                  />
                </div>

                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                
                {/* Status badges */}
                <div className="absolute top-2 left-10 flex gap-1">
                  {item.featured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {item.is_public && (
                    <Badge className="bg-green-500 text-white">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleShare(item)}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    title={item.is_public ? 'Copy share link' : 'Make public & share'}
                  >
                    {item.is_public ? <Copy className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleFeatured(item)}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    {item.featured ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* View count */}
                {item.view_count > 0 && (
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      <Eye className="h-3 w-3 mr-1" />
                      {item.view_count}
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  {item.category && (
                    <Badge variant="outline">
                      {item.category}
                    </Badge>
                  )}
                  {item.template_type && (
                    <Badge variant="secondary">
                      <Palette className="h-3 w-3 mr-1" />
                      {portfolioTemplates.find(t => t.id === item.template_type)?.name || item.template_type}
                    </Badge>
                  )}
                </div>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                {item.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PortfolioManager;