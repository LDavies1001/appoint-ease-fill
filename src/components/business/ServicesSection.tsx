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
    // Use the same categories as onboarding
    const onboardingCategories = [
      {
        id: 'beauty',
        name: 'Beauty & Personal Care',
        description: 'Beauty treatments, personal care services'
      },
      {
        id: 'cleaning', 
        name: 'Cleaning Services',
        description: 'Domestic and commercial cleaning'
      },
      {
        id: 'home',
        name: 'Home & Handy Services', 
        description: 'Home improvement and handyman services'
      }
    ];
    setAllCategories(onboardingCategories);
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
      // Use the selected categories directly as services_offered
      const { error } = await supabase
        .from('provider_details')
        .update({
          services_offered: editData.business_categories,
          pricing_info: editData.pricing_info
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate({
        services_offered: editData.business_categories,
        pricing_info: editData.pricing_info,
        business_categories: editData.business_categories.map(categoryId => 
          allCategories.find(cat => cat.id === categoryId)
        ).filter(Boolean)
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

        {/* Business Services Section */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Your Services</Label>
            {isEditing ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Edit your service offerings. These are the specific services customers can book.
                </p>
                {services.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg bg-background"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{service.service_name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            {service.base_price && (
                              <Badge variant="secondary">£{service.base_price}</Badge>
                            )}
                            {service.duration_minutes && (
                              <Badge variant="outline">{service.duration_minutes} mins</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="text-provider hover:text-provider"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceDeleted(service.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No services found</p>
                    <p className="text-sm text-muted-foreground mt-1">Add services to start taking bookings</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {services && services.length > 0 ? (
                  <div className="grid gap-3">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{service.service_name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {service.base_price && (
                            <Badge variant="secondary">£{service.base_price}</Badge>
                          )}
                          {service.duration_minutes && (
                            <Badge variant="outline">{service.duration_minutes} mins</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No services available</p>
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