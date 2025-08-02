import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CategorySelector } from '@/components/ui/category-selector';
import { ServiceItem } from './ServiceItem';
import { AddServiceModal } from './AddServiceModal';
import { Building, Edit2, Save, X, Plus } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  duration_text?: string;
  is_active: boolean;
}

interface ServicesData {
  services_offered: string[];
  business_categories: any[];
  pricing_info: string;
}

interface ServicesSectionProps {
  data: ServicesData;
  userId: string;
  onUpdate: (updatedData: Partial<ServicesData>) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  data,
  userId,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchServices();
  }, []);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  const fetchCategories = async () => {
    try {
      const { data: categories, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setAllCategories(categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data: servicesData, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert selected category IDs to category objects
      const selectedCategoryObjects = editData.business_categories.map(categoryId => 
        allCategories.find(cat => cat.id === categoryId)
      ).filter(Boolean);

      const { error } = await supabase
        .from('provider_details')
        .update({
          services_offered: editData.services_offered,
          pricing_info: editData.pricing_info,
          business_category: selectedCategoryObjects.length > 0 ? selectedCategoryObjects[0].id : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate({
        services_offered: editData.services_offered,
        pricing_info: editData.pricing_info,
        business_categories: selectedCategoryObjects
      });

      setIsEditing(false);
      toast({
        title: "Services updated",
        description: "Your business services have been updated successfully"
      });
    } catch (error) {
      console.error('Error updating services:', error);
      toast({
        title: "Update failed",
        description: "Could not update your services. Please try again.",
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

  const handleCategoryChange = (selectedCategories: string[]) => {
    setEditData(prev => ({
      ...prev,
      business_categories: selectedCategories
    }));
  };

  const handleAddService = () => {
    setEditingService(null);
    setShowAddService(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowAddService(true);
  };

  const handleServiceSaved = (savedService: Service) => {
    if (editingService) {
      setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
    } else {
      setServices(prev => [savedService, ...prev]);
    }
  };

  const handleServiceDeleted = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const activeServices = services.filter(s => s.is_active);
  const totalValue = activeServices.reduce((sum, service) => sum + service.base_price, 0);

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-xl font-semibold">Services & Pricing</h3>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="provider-outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  variant="provider"
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="provider-outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Business Categories Section */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Business Categories</Label>
            {isEditing ? (
               <CategorySelector
                categories={allCategories.map(cat => ({
                  id: cat.id,
                  name: cat.name,
                  description: cat.description,
                  category_type: cat.category_type
                }))}
                selectedCategories={Array.isArray(editData.business_categories) ? 
                  editData.business_categories.map(cat => typeof cat === 'string' ? cat : cat.id) : []}
                onSelectionChange={handleCategoryChange}
                maxSelections={5}
              />
            ) : (
              <div>
                {data.business_categories && data.business_categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.business_categories.map((category, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No services selected</p>
                )}
              </div>
            )}
          </div>

          {/* Service Pricing List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Service Pricing List</Label>
              {!isEditing && (
                <div className="flex items-center gap-4">
                  <Button variant="provider" size="sm" onClick={handleAddService}>
                    <Plus className="h-4 w-4" />
                    Add Service
                  </Button>
                </div>
              )}
            </div>
            
            {services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service) => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    onEdit={handleEditService}
                    onDelete={handleServiceDeleted}
                    isEditing={!isEditing}
                  />
                ))}
                {isEditing && (
                  <Button
                    variant="provider-outline"
                    onClick={handleAddService}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Service
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                <div className="h-12 w-12 text-muted-foreground mx-auto mb-3 flex items-center justify-center text-2xl font-bold">£</div>
                <p className="text-muted-foreground mb-4">No services added yet</p>
                <Button variant="provider" onClick={handleAddService}>
                  <Plus className="h-4 w-4" />
                  Add Your First Service
                </Button>
              </div>
            )}
          </div>

          {/* Additional Pricing Information */}
          <div>
            <Label htmlFor="pricing_info" className="text-base font-medium">
              Additional Pricing Information
            </Label>
            {isEditing ? (
              <Textarea
                id="pricing_info"
                value={editData.pricing_info}
                onChange={(e) => setEditData(prev => ({ ...prev, pricing_info: e.target.value }))}
                placeholder="Any additional pricing details, packages, discounts, etc."
                className="mt-2"
                rows={4}
              />
            ) : (
              <div className="mt-2">
                {data.pricing_info ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.pricing_info}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No additional pricing information provided</p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <AddServiceModal
        isOpen={showAddService}
        onClose={() => setShowAddService(false)}
        onSave={handleServiceSaved}
        editingService={editingService}
        userId={userId}
      />
    </>
  );
};