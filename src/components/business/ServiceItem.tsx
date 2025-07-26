import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Edit2, Trash2, Clock, DollarSign } from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  discount_price?: number;
  duration_minutes: number;
  duration_text?: string;
  is_active: boolean;
}

interface ServiceItemProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  isEditing: boolean;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onEdit,
  onDelete,
  isEditing
}) => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;

      onDelete(service.id);
      toast({
        title: "Service deleted",
        description: "The service has been removed successfully"
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card className="p-4 border border-border/50 hover:border-provider/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-foreground">{service.service_name}</h4>
            {!service.is_active && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          
          {service.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {service.description}
            </p>
          )}
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-provider">
              <DollarSign className="h-4 w-4" />
              {service.discount_price ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">£{service.discount_price}</span>
                  <span className="text-muted-foreground line-through text-xs">£{service.base_price}</span>
                </div>
              ) : (
                <span className="font-medium">£{service.base_price}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{service.duration_text || formatDuration(service.duration_minutes)}</span>
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="provider-outline"
              size="sm"
              onClick={() => onEdit(service)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};