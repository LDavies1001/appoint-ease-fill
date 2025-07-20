import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarIcon, 
  PoundSterling, 
  X, 
  Plus,
  Clock,
  Calendar as CalendarDays,
  Save,
  Trash2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { format, addDays, eachDayOfInterval, isWeekend } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface ProviderService {
  id: string;
  service_name: string;
  base_price?: number;
  duration_minutes: number;
}

interface TimeSlot {
  start_time: string;
  duration: number;
}

interface BulkSlotCreatorProps {
  providerServices: ProviderService[];
  onSuccess: () => void;
  onCancel: () => void;
}

const BulkSlotCreator: React.FC<BulkSlotCreatorProps> = ({
  providerServices,
  onSuccess,
  onCancel
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ start_time: '09:00', duration: 60 }]);
  const [selectedService, setSelectedService] = useState('');
  const [customServiceName, setCustomServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [selectedWeekdays, setSelectedWeekdays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [loading, setLoading] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();

  const weekdays = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' }
  ];

  const handleServiceChange = (serviceId: string) => {
    setSelectedService(serviceId);
    setCustomServiceName('');
    
    const service = providerServices.find(s => s.id === serviceId);
    if (service) {
      setPrice(service.base_price?.toString() || '');
      // Update all time slots with the service duration
      setTimeSlots(prev => prev.map(slot => ({ ...slot, duration: service.duration_minutes })));
    }
  };

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const lastEndTime = new Date(`2000-01-01T${lastSlot.start_time}`);
    lastEndTime.setMinutes(lastEndTime.getMinutes() + lastSlot.duration);
    
    setTimeSlots(prev => [...prev, {
      start_time: lastEndTime.toTimeString().slice(0, 5),
      duration: lastSlot.duration
    }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length > 1) {
      setTimeSlots(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    setTimeSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const generateDatesFromRange = () => {
    if (!dateRange?.from || !dateRange?.to) return;
    
    const dates = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const filteredDates = dates.filter(date => {
      const dayOfWeek = date.getDay();
      
      if (skipWeekends && isWeekend(date)) return false;
      if (selectedWeekdays.length > 0 && !selectedWeekdays.includes(dayOfWeek)) return false;
      
      return true;
    });
    
    setSelectedDates(filteredDates);
  };

  const handleWeekdayToggle = (day: number) => {
    setSelectedWeekdays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const calculateTotalSlots = () => {
    return selectedDates.length * timeSlots.length;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WebP image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.user_id}-bulk-slot-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      
      toast({
        title: "Image uploaded successfully!",
        description: "This image will be applied to all created slots"
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const removeImage = () => {
    setImageUrl('');
  };

  const handleBulkCreate = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Please select dates",
        variant: "destructive"
      });
      return;
    }

    if (timeSlots.length === 0) {
      toast({
        title: "Please add at least one time slot",
        variant: "destructive"
      });
      return;
    }

    if (!selectedService) {
      toast({
        title: "Please select a service",
        variant: "destructive"
      });
      return;
    }

    if (!price.trim()) {
      toast({
        title: "Please enter a price",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const slotsToCreate = [];
      
      for (const date of selectedDates) {
        for (const timeSlot of timeSlots) {
          const startTime = new Date(`2000-01-01T${timeSlot.start_time}`);
          const endTime = new Date(startTime.getTime() + timeSlot.duration * 60000);
          
          const slotData: any = {
            provider_id: profile?.user_id,
            date: format(date, 'yyyy-MM-dd'),
            start_time: timeSlot.start_time,
            end_time: endTime.toTimeString().slice(0, 5),
            duration: timeSlot.duration,
            price: parseFloat(price),
            discount_price: discountPrice ? parseFloat(discountPrice) : null,
            notes: notes.trim() || null,
            image_url: imageUrl || null
          };

          slotData.provider_service_id = selectedService;

          slotsToCreate.push(slotData);
        }
      }

      const { error } = await supabase
        .from('availability_slots')
        .insert(slotsToCreate);

      if (error) throw error;

      toast({
        title: "Slots created successfully!",
        description: `Created ${slotsToCreate.length} availability slots`
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error creating slots",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="card-elegant p-8 border-primary/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Bulk Create Slots
          </h3>
          <p className="text-muted-foreground mt-1">Create multiple availability slots efficiently across multiple dates</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="hover:bg-destructive/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-8">
        {/* Service Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Service *</Label>
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger>
              <SelectValue placeholder={providerServices.length > 0 ? "Select a service" : "No services found - please add services first"} />
            </SelectTrigger>
            <SelectContent>
              {providerServices.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.service_name} {service.base_price && `(£${service.base_price})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-6">
          <Label className="text-sm font-medium">Date Selection *</Label>
          
          {/* Date Range Picker */}
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-64 justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline" 
              onClick={generateDatesFromRange}
              disabled={!dateRange?.from || !dateRange?.to}
            >
              Generate Dates
            </Button>
          </div>

          {/* Weekday Selection */}
          <div className="space-y-2">
            <Label>Days of the week</Label>
            <div className="flex flex-wrap gap-2">
              {weekdays.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={selectedWeekdays.includes(day.value)}
                    onCheckedChange={() => handleWeekdayToggle(day.value)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Skip Weekends Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-weekends"
              checked={skipWeekends}
              onCheckedChange={(checked) => setSkipWeekends(checked === true)}
            />
            <Label htmlFor="skip-weekends">Skip weekends when generating from date range</Label>
          </div>

          {/* Selected Dates Preview */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Dates ({selectedDates.length})</Label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded">
                {selectedDates.slice(0, 20).map((date, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {format(date, 'MMM dd')}
                  </Badge>
                ))}
                {selectedDates.length > 20 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedDates.length - 20} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Time Slots *</Label>
            <Button variant="outline" size="sm" onClick={addTimeSlot}>
              <Plus className="h-4 w-4 mr-1" />
              Add Time
            </Button>
          </div>
          
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">for</span>
                <Input
                  type="number"
                  value={slot.duration}
                  onChange={(e) => updateTimeSlot(index, 'duration', parseInt(e.target.value))}
                  min="15"
                  step="15"
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">min</span>
                {timeSlots.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTimeSlot(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-4">
          <Label>Slot Image (optional)</Label>
          <p className="text-sm text-muted-foreground">
            Upload an image that will be applied to all slots created in this bulk operation
          </p>
          
          <div className="flex items-center gap-4">
            <label htmlFor="bulk-image-upload" className="cursor-pointer">
              <div className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4" />
                <span className="text-sm">
                  {uploadingImage ? "Uploading..." : "Upload Image"}
                </span>
              </div>
              <input
                id="bulk-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />
            </label>
            
            {imageUrl && (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Bulk slot image" 
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 p-0 bg-background"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          
          {imageUrl && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>This image will be added to all {calculateTotalSlots()} slots</span>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Price *</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="25.00"
                className="pl-10 h-11"
                required
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium">Discounted Price (optional)</Label>
            <div className="relative">
              <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                min="0"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="20.00"
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Any special notes for these slots..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Summary */}
        {selectedDates.length > 0 && timeSlots.length > 0 && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Dates:</span>
                <p className="font-medium">{selectedDates.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Time slots per day:</span>
                <p className="font-medium">{timeSlots.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Total slots:</span>
                <p className="font-medium text-primary">{calculateTotalSlots()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkCreate} 
            disabled={loading || selectedDates.length === 0}
            variant="hero"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : `Create ${calculateTotalSlots()} Slots`}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BulkSlotCreator;