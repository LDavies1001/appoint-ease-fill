import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Clock,
  PoundSterling
} from 'lucide-react';

interface ProviderService {
  id: string;
  service_name: string;
  description?: string;
  base_price?: number;
  duration_minutes: number;
  is_active: boolean;
}

interface ServiceManagerProps {
  onServiceUpdate?: () => void;
}

const ServiceManager: React.FC<ServiceManagerProps> = ({ onServiceUpdate }) => {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    service_name: '',
    description: '',
    base_price: '',
    duration_minutes: 60
  });

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', profile?.user_id)
        .order('service_name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error loading services",
        description: "Could not load your service list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_name.trim()) {
      toast({
        title: "Service name required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_services')
        .insert({
          provider_id: profile?.user_id,
          service_name: formData.service_name.trim(),
          description: formData.description.trim() || null,
          base_price: formData.base_price ? parseFloat(formData.base_price) : null,
          duration_minutes: formData.duration_minutes
        });

      if (error) throw error;

      toast({
        title: "Service added successfully!"
      });

      setFormData({
        service_name: '',
        description: '',
        base_price: '',
        duration_minutes: 60
      });
      setShowAddForm(false);
      fetchServices();
      onServiceUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error adding service",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateService = async (serviceId: string, updates: Partial<ProviderService>) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .update(updates)
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service updated successfully!"
      });

      setEditingService(null);
      fetchServices();
      onServiceUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error updating service",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service deleted successfully!"
      });

      fetchServices();
      onServiceUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error deleting service",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    await handleUpdateService(serviceId, { is_active: !currentStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Your Services</h3>
          <p className="text-muted-foreground">Manage your service offerings and pricing</p>
        </div>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Add Service Form */}
      {showAddForm && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">Add New Service</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_name">Service Name *</Label>
                <Input
                  id="service_name"
                  value={formData.service_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="e.g., Classic Lash Extensions"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price (£)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
                  placeholder="25.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this service..."
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Add Service
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Services List */}
      <div className="space-y-4">
        {services.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No services added yet</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Service
            </Button>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingService === service.id ? (
                      <EditServiceForm
                        service={service}
                        onSave={(updates) => handleUpdateService(service.id, updates)}
                        onCancel={() => setEditingService(null)}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-lg font-semibold">{service.service_name}</h4>
                          <Badge variant={service.is_active ? "default" : "secondary"}>
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {service.description && (
                          <p className="text-muted-foreground">{service.description}</p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {service.base_price && (
                            <div className="flex items-center">
                              <PoundSterling className="h-4 w-4 mr-1" />
                              <span>{service.base_price}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{service.duration_minutes} min</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {editingService !== service.id && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      >
                        {service.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingService(service.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

interface EditServiceFormProps {
  service: ProviderService;
  onSave: (updates: Partial<ProviderService>) => void;
  onCancel: () => void;
}

const EditServiceForm: React.FC<EditServiceFormProps> = ({ service, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    service_name: service.service_name,
    description: service.description || '',
    base_price: service.base_price?.toString() || '',
    duration_minutes: service.duration_minutes
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      service_name: formData.service_name.trim(),
      description: formData.description.trim() || undefined,
      base_price: formData.base_price ? parseFloat(formData.base_price) : undefined,
      duration_minutes: formData.duration_minutes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit_service_name">Service Name</Label>
          <Input
            id="edit_service_name"
            value={formData.service_name}
            onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_base_price">Base Price (£)</Label>
          <Input
            id="edit_base_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_price}
            onChange={(e) => setFormData(prev => ({ ...prev, base_price: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_duration_minutes">Duration (minutes)</Label>
          <Input
            id="edit_duration_minutes"
            type="number"
            min="15"
            step="15"
            value={formData.duration_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit_description">Description</Label>
        <Textarea
          id="edit_description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex space-x-2">
        <Button type="submit" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

console.log('ServiceManager component loaded');
export default ServiceManager;