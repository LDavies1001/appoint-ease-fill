import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SimpleCategorySelector } from '@/components/ui/simple-category-selector';
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
  
  // Onboarding services state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<Record<string, string[]>>({});
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (userId) {
      fetchProviderServices();
      fetchOnboardingData();
    }
  }, [userId]);

  const fetchCategories = () => {
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

  const fetchProviderServices = async () => {
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

  const fetchOnboardingData = async () => {
    try {
      const { data: providerData, error } = await supabase
        .from('provider_details')
        .select('services_offered')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (providerData?.services_offered) {
        // Parse the services_offered data which should contain category->services mapping
        const servicesData = providerData.services_offered;
        if (typeof servicesData === 'object' && !Array.isArray(servicesData)) {
          setSelectedServices(servicesData);
          setSelectedCategories(Object.keys(servicesData));
        } else if (Array.isArray(servicesData)) {
          // Legacy format - convert to new format
          setSelectedCategories(servicesData);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save the onboarding services selection
      const { error } = await supabase
        .from('provider_details')
        .update({
          services_offered: Object.keys(selectedServices),
          pricing_info: editData.pricing_info
        })
        .eq('user_id', userId);

      if (error) throw error;

      onUpdate({
        services_offered: Object.keys(selectedServices),
        pricing_info: editData.pricing_info,
        business_categories: selectedCategories.map(categoryId => 
          allCategories.find(cat => cat.id === categoryId)
        ).filter(Boolean)
      });

      setIsEditing(false);
      toast({
        title: "Services updated",
        description: "Your service offerings have been updated successfully."
      });
    } catch (error) {
      console.error('Error updating services:', error);
      toast({
        title: "Error updating services",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
    // Reset to original data
    fetchOnboardingData();
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
  };

  const handleAddService = () => {
    setShowAddService(true);
  };

  const handleServiceAdded = () => {
    setShowAddService(false);
    fetchProviderServices();
  };

  const handleServiceUpdated = () => {
    setEditingService(null);
    fetchProviderServices();
  };

  const handleServiceDeleted = (serviceId: string) => {
    setServices(prevServices => prevServices.filter(s => s.id !== serviceId));
  };

  // Get all selected services from all categories
  const getAllSelectedServices = () => {
    const allServices: string[] = [];
    Object.values(selectedServices).forEach(categoryServices => {
      allServices.push(...categoryServices);
    });
    return allServices;
  };

  return (
    <Card className="card-elegant">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-provider/20 rounded-xl">
              <Building className="h-5 w-5 text-provider" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Services & Pricing</h3>
              <p className="text-muted-foreground text-sm">Manage your service offerings and pricing information</p>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="border-provider/20 hover:border-provider"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Services
            </Button>
          )}
        </div>

        {/* Onboarding Services Section */}
        <div className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Your Service Offerings</Label>
            <p className="text-sm text-muted-foreground mb-4">
              These are the services customers can book with you. 
              {isEditing ? " Select categories and specific services you offer." : ""}
            </p>
            
            {isEditing ? (
              <SimpleCategorySelector
                categories={allCategories}
                selectedCategories={selectedCategories}
                onSelectionChange={setSelectedCategories}
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
                maxSelections={3}
                className="mb-6"
              />
            ) : (
              <div className="space-y-4">
                {Object.keys(selectedServices).length > 0 ? (
                  Object.entries(selectedServices).map(([categoryId, categoryServices]) => {
                    const category = allCategories.find(cat => cat.id === categoryId);
                    return (
                      <div key={categoryId} className="space-y-3">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {category?.name || categoryId}
                          </Badge>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {categoryServices.map((service, index) => (
                            <div
                              key={index}
                              className="p-3 bg-muted/30 rounded-lg border border-border/50"
                            >
                              <span className="text-sm font-medium text-foreground">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 border border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground">No services selected yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Edit Services" to add your service offerings</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="space-y-3">
            <Label htmlFor="pricing_info" className="text-base font-medium">General Pricing Information</Label>
            {isEditing ? (
              <Textarea
                id="pricing_info"
                placeholder="Describe your general pricing structure, packages, or any pricing notes..."
                value={editData.pricing_info || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, pricing_info: e.target.value }))}
                rows={4}
                className="resize-none"
              />
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                {editData.pricing_info ? (
                  <p className="text-foreground whitespace-pre-wrap">{editData.pricing_info}</p>
                ) : (
                  <p className="text-muted-foreground italic">No pricing information provided</p>
                )}
              </div>
            )}
          </div>

          {/* Service Pricing List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-medium">Detailed Service Pricing</Label>
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
                  <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Tip:</strong> These are your detailed service offerings with specific pricing. 
                      Exit editing mode to add, edit, or remove individual services.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">No detailed services added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add specific services with pricing details to help customers understand your offerings
                </p>
                {!isEditing && (
                  <Button variant="outline" className="mt-3" onClick={handleAddService}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Service
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="provider"
                className="shadow-elegant"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddService && (
        <AddServiceModal
          isOpen={showAddService}
          onClose={() => setShowAddService(false)}
          onSave={handleServiceAdded}
          userId={userId}
        />
      )}

      {editingService && (
        <AddServiceModal
          isOpen={true}
          onClose={() => setEditingService(null)}
          onSave={handleServiceUpdated}
          editingService={editingService}
          userId={userId}
        />
      )}
    </Card>
  );
};