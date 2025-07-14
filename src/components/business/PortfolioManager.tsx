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
import { Plus, Edit, Trash2, Star, StarOff, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
}

const PortfolioManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    featured: false,
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchPortfolioItems();
    }
  }, [user]);

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

  const handleImageUpload = async (file: File) => {
    if (!user) return null;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
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
      image_url: ''
    });
    setEditingItem(null);
  };

  const handleEdit = (item: PortfolioItem) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      featured: item.featured,
      image_url: item.image_url
    });
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Portfolio</h2>
          <p className="text-muted-foreground">Showcase your work to potential customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Portfolio Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Lash Extensions, Nail Art"
                />
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

              <div>
                <Label htmlFor="image">Image *</Label>
                <div className="mt-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const imageUrl = await handleImageUpload(file);
                        if (imageUrl) {
                          setFormData({ ...formData, image_url: imageUrl });
                        }
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {uploadingImage && (
                    <p className="text-sm text-muted-foreground mt-1">Uploading image...</p>
                  )}
                  {formData.image_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="featured">Featured item</Label>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                {item.featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleFeatured(item)}
                    className="h-8 w-8 p-0"
                  >
                    {item.featured ? <StarOff className="h-3 w-3" /> : <Star className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 p-0"
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
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{item.title}</h3>
                </div>
                {item.category && (
                  <Badge variant="outline" className="mb-2">
                    {item.category}
                  </Badge>
                )}
                {item.description && (
                  <p className="text-muted-foreground text-sm">{item.description}</p>
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