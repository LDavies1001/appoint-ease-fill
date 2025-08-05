import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  Clock, 
  PoundSterling, 
  Calendar,
  Bookmark,
  Share2,
  Users
} from 'lucide-react';

interface ProviderService {
  id: string;
  service_name: string;
  duration_minutes: number;
  base_price: number;
  image_url?: string;
}

interface QuickSlotCreatorProps {
  onClose: () => void;
  onSuccess: () => void;
}

const QuickSlotCreator: React.FC<QuickSlotCreatorProps> = ({ onClose, onSuccess }) => {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', profile?.user_id)
        .eq('is_active', true);
      
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setPrice(service.base_price.toString());
    }
  };

  const createSlot = async () => {
    if (!selectedService || !date || !time || !price) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const service = services.find(s => s.id === selectedService);
      const duration = service?.duration_minutes || 60;
      
      // Calculate end time
      const startTime = new Date(`${date}T${time}`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
      
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          provider_id: profile?.user_id,
          provider_service_id: selectedService,
          date: date,
          start_time: time,
          end_time: endTime.toTimeString().split(' ')[0],
          duration: duration,
          price: parseFloat(price),
          image_url: service?.image_url
        });

      if (error) throw error;

      toast({
        title: "Slot created successfully! 🎉",
        description: "Your slot is now available for booking"
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: "Error creating slot",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <Card className="w-full rounded-t-3xl bg-background max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Slot Creator</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service" className="text-sm font-medium">
              Select Service *
            </Label>
            <Select value={selectedService} onValueChange={handleServiceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose your service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{service.service_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {service.duration_minutes}min • £{service.base_price}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {services.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No services found. Create a service first in your profile.
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date *
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full"
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium">
              Time *
            </Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-48">
                {generateTimeSlots().map((timeSlot) => (
                  <SelectItem key={timeSlot} value={timeSlot}>
                    {timeSlot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">
              Price *
            </Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="pl-10"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          {/* Auto-filled info */}
          {selectedService && (
            <Card className="p-3 bg-business-muted/20 border-business-primary/20">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Auto-filled:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Duration: {services.find(s => s.id === selectedService)?.duration_minutes}min</span>
                  </div>
                  {services.find(s => s.id === selectedService)?.image_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs">✅ Service image included</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Create Button */}
          <Button
            onClick={createSlot}
            disabled={loading || !selectedService || !date || !time || !price}
            className="w-full h-12 text-base btn-business"
          >
            {loading ? 'Creating...' : 'Create Slot'}
          </Button>

          {/* Post-creation actions preview */}
          <Card className="p-3 bg-accent/10 border-accent/20">
            <p className="text-sm font-medium text-accent mb-2">After creating:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 className="h-3 w-3" />
                <span>Share on WhatsApp/Instagram/Facebook</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Notify past customers (optional)</span>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default QuickSlotCreator;