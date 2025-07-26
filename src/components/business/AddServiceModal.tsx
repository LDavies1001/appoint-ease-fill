import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, X } from 'lucide-react';

interface Service {
  id?: string;
  service_name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
}

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  editingService?: Service | null;
  userId: string;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingService,
  userId
}) => {
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    service_name: '',
    description: '',
    base_price: 0,
    duration_minutes: 60,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingService) {
      setFormData({
        service_name: editingService.service_name,
        description: editingService.description || '',
        base_price: editingService.base_price,
        duration_minutes: editingService.duration_minutes,
        is_active: editingService.is_active
      });
    } else {
      setFormData({
        service_name: '',
        description: '',
        base_price: 0,
        duration_minutes: 60,
        is_active: true
      });
    }
  }, [editingService, isOpen]);

  const handleSave = async () => {
    if (!formData.service_name.trim()) {
      toast({
        title: "Service name required",
        description: "Please enter a service name",
        variant: "destructive"
      });
      return;
    }

    if (formData.base_price < 0) {
      toast({
        title: "Invalid price",
        description: "Price must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast({
        title: "Invalid duration",
        description: "Duration must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let savedService: Service;

      if (editingService?.id) {
        // Update existing service
        const { data, error } = await supabase
          .from('provider_services')
          .update({
            service_name: formData.service_name,
            description: formData.description,
            base_price: formData.base_price,
            duration_minutes: formData.duration_minutes,
            is_active: formData.is_active
          })
          .eq('id', editingService.id)
          .select()
          .single();

        if (error) throw error;
        savedService = data;
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('provider_services')
          .insert({
            provider_id: userId,
            service_name: formData.service_name,
            description: formData.description,
            base_price: formData.base_price,
            duration_minutes: formData.duration_minutes,
            is_active: formData.is_active
          })
          .select()
          .single();

        if (error) throw error;
        savedService = data;
      }

      onSave(savedService);
      onClose();
      
      toast({
        title: editingService ? "Service updated" : "Service created",
        description: `${formData.service_name} has been ${editingService ? 'updated' : 'added'} successfully`
      });
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        title: "Save failed",
        description: "Could not save the service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} minutes`;
    if (mins === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              value={formData.service_name}
              onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
              placeholder="e.g., Classic Manicure"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the service..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_price">Price (£) *</Label>
              <Input
                id="base_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="duration_text">Duration *</Label>
              <Input
                id="duration_text"
                type="text"
                value={formData.duration_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_text: e.target.value }))}
                placeholder="e.g., 60 min, 1.5 hours, 45-90 min"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter duration in any format
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Service</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="provider-outline" onClick={onClose} disabled={saving}>
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button variant="provider" onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingService ? 'Update' : 'Create'} Service
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};