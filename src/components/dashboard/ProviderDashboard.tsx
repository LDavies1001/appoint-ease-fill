import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { AddRoleCard } from '@/components/ui/role-switcher';
import LibraryTab from './LibraryTab';
import ProfileTab from './ProfileTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ServiceManager from '@/components/business/ServiceManager';
import { 
  Plus, 
  Calendar, 
  Clock, 
  PoundSterling, 
  Users,
  LogOut,
  Settings,
  BookOpen,
  Upload,
  X,
  Wrench,
  Zap,
  Image
} from 'lucide-react';
import BulkSlotCreator from './BulkSlotCreator';

interface ProviderService {
  id: string;
  service_name: string;
  description?: string;
  base_price?: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  typical_duration: number;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  discount_price?: number;
  image_url?: string;
  notes: string;
  is_booked: boolean;
  provider_service?: {
    service_name: string;
  };
  service?: {
    name: string;
  };
  custom_service_name?: string;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  customer: {
    name: string;
  };
  service: {
    name: string;
  };
}

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('slots');
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for adding slots
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [slotForm, setSlotForm] = useState({
    provider_service_id: '',
    custom_service_name: '',
    date: '',
    start_time: '',
    duration: 60,
    price: '',
    discount_price: '',
    notes: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
    fetchMySlots();
    fetchMyBookings();
    fetchProviderServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMySlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select(`
          *,
          service:services(name),
          provider_service:provider_services(service_name)
        `)
        .eq('provider_id', profile?.user_id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSlots = data?.map(slot => ({
        ...slot,
        service: {
          name: slot.service?.name || slot.provider_service?.service_name || slot.custom_service_name || 'Unknown Service'
        }
      })) || [];

      setMySlots(formattedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(name),
          service:services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedBookings = data?.map(booking => ({
        ...booking,
        customer: {
          name: booking.customer?.name || 'Unknown Customer'
        },
        service: {
          name: booking.service?.name || 'Unknown Service'
        }
      })) || [];

      setMyBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchProviderServices = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', profile?.user_id)
        .eq('is_active', true)
        .order('service_name', { ascending: true });

      if (error) throw error;
      setProviderServices(data || []);
    } catch (error) {
      console.error('Error fetching provider services:', error);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate service selection and required fields
    if (!slotForm.provider_service_id || !slotForm.date || !slotForm.start_time || !slotForm.price) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTime = new Date(`2000-01-01T${slotForm.start_time}`);
      const endTime = new Date(startTime.getTime() + slotForm.duration * 60000);
      
      const insertData: any = {
        provider_id: profile?.user_id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: endTime.toTimeString().slice(0, 5),
        duration: slotForm.duration,
        price: parseFloat(slotForm.price),
        discount_price: slotForm.discount_price ? parseFloat(slotForm.discount_price) : null,
        image_url: slotForm.image_url || null,
        notes: slotForm.notes
      };

      // Add provider service
      insertData.provider_service_id = slotForm.provider_service_id;
      
      const { error } = await supabase
        .from('availability_slots')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Slot added successfully!",
      });

      // Reset form
      setSlotForm({
        provider_service_id: '',
        custom_service_name: '',
        date: '',
        start_time: '',
        duration: 60,
        price: '',
        discount_price: '',
        notes: '',
        image_url: ''
      });
      setShowAddSlot(false);
      fetchMySlots();
    } catch (error: any) {
      toast({
        title: "Error adding slot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.user_id}-slot-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(filePath);

      setSlotForm(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Slot deleted successfully",
      });
      
      fetchMySlots();
    } catch (error: any) {
      toast({
        title: "Error deleting slot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const upcomingBookings = myBookings.filter(booking => 
    new Date(booking.booking_date) >= new Date()
  );

  const todaysSlots = mySlots.filter(slot => 
    slot.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-8">
      {/* Add Role Card */}
      <AddRoleCard />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-elegant p-6 hover:shadow-accent transition-smooth">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-provider/10">
              <Calendar className="h-8 w-8 text-provider" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Today's Slots</p>
              <p className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">{todaysSlots.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="card-elegant p-6 hover:shadow-accent transition-smooth">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-provider-secondary/20">
              <BookOpen className="h-8 w-8 text-provider" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Upcoming Bookings</p>
              <p className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">{upcomingBookings.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="card-elegant p-6 hover:shadow-accent transition-smooth">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-provider/10">
              <Users className="h-8 w-8 text-provider" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Slots</p>
              <p className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">{mySlots.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'slots' ? 'provider-hero' : 'ghost'}
          onClick={() => setActiveTab('slots')}
          className="flex-1 min-w-fit"
        >
          <Calendar className="h-4 w-4 mr-2" />
          My Slots
        </Button>
        <Button
          variant={activeTab === 'services' ? 'provider-hero' : 'ghost'}
          onClick={() => setActiveTab('services')}
          className="flex-1 min-w-fit"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Services
        </Button>
        <Button
          variant={activeTab === 'bookings' ? 'provider-hero' : 'ghost'}
          onClick={() => setActiveTab('bookings')}
          className="flex-1 min-w-fit"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Bookings
        </Button>
        <Button
          variant={activeTab === 'library' ? 'provider-hero' : 'ghost'}
          onClick={() => setActiveTab('library')}
          className="flex-1 min-w-fit"
        >
          <Image className="h-4 w-4 mr-2" />
          Library
        </Button>
        <Button
          variant={activeTab === 'profile' ? 'provider-hero' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          className="flex-1 min-w-fit"
        >
          <Settings className="h-4 w-4 mr-2" />
          Profile
        </Button>
      </div>

      {activeTab === 'slots' && (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                Manage Availability
              </h2>
              <p className="text-muted-foreground mt-1">
                Create and manage your available appointment slots
              </p>
            </div>
            {!showAddSlot && !showBulkCreator && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkCreator(true)}
                  className="border-provider/20 hover:border-provider"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Create
                </Button>
                <Button
                  variant="provider-hero"
                  onClick={() => setShowAddSlot(true)}
                  className="shadow-elegant"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>
            )}
          </div>

          {/* Add Slot Form */}
          {showAddSlot && (
            <Card className="card-elegant p-8 border-provider/10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                    Add New Slot
                  </h3>
                  <p className="text-muted-foreground mt-1">Create a new availability slot for your services</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddSlot(false)} className="hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddSlot} className="space-y-8">
                {/* Service Selection */}
                <div className="space-y-3">
                  <Label htmlFor="service" className="text-sm font-medium">Service *</Label>
                  <Select 
                    value={slotForm.provider_service_id} 
                    onValueChange={(value) => {
                      setSlotForm(prev => ({ ...prev, provider_service_id: value, custom_service_name: "" }));
                      // Auto-fill price and duration from provider service
                      const selectedService = providerServices.find(s => s.id === value);
                      if (selectedService) {
                        setSlotForm(prev => ({ 
                          ...prev, 
                          price: selectedService.base_price?.toString() || "",
                          duration: selectedService.duration_minutes
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={providerServices.length > 0 ? "Select a service from your offerings" : "No services found - please add services first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {providerServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.service_name} {service.base_price && `(£${service.base_price})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {providerServices.length === 0 && (
                    <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
                      💡 You can type any service name here, or add predefined services in the Services tab for easier management.
                    </p>
                  )}
                </div>

                {/* Date & Time Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={slotForm.date}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="start_time" className="text-sm font-medium">Start Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_time"
                        type="time"
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={slotForm.duration}
                      onChange={(e) => setSlotForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                        value={slotForm.price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, price: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="discount_price" className="text-sm font-medium">Discounted Price (optional)</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="discount_price"
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                        value={slotForm.discount_price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, discount_price: e.target.value }))}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Slot Image (optional)</Label>
                  <p className="text-sm text-muted-foreground">Add an attractive image to showcase your service</p>
                  
                  <div className="flex items-center gap-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-provider/50 hover:bg-provider/5 transition-smooth">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {uploading ? "Uploading..." : "Upload Image"}
                        </span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    
                    {slotForm.image_url && (
                      <div className="relative group">
                        <img 
                          src={slotForm.image_url} 
                          alt="Slot preview" 
                          className="w-20 h-20 object-cover rounded-xl border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSlotForm(prev => ({ ...prev, image_url: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-medium">Special Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any special instructions, requirements, or notes about this slot..."
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    variant="provider-hero"
                    className="shadow-elegant"
                    disabled={uploading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {uploading ? "Creating..." : "Create Slot"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

            {/* Bulk Slot Creator */}
            {showBulkCreator && (
              <BulkSlotCreator
                providerServices={providerServices}
                onSuccess={() => {
                  setShowBulkCreator(false);
                  fetchMySlots();
                }}
                onCancel={() => setShowBulkCreator(false)}
              />
            )}

            {/* Slots List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
                </div>
              ) : mySlots.length === 0 ? (
                <Card className="card-elegant p-8 text-center">
                  <p className="text-muted-foreground">No slots created yet.</p>
                  <Button
                    variant="provider-hero"
                    className="mt-4"
                    onClick={() => setShowAddSlot(true)}
                  >
                    Create Your First Slot
                  </Button>
                </Card>
              ) : (
                mySlots.map((slot) => (
                  <Card key={slot.id} className="card-elegant p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {slot.service.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(slot.date)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={slot.is_booked ? 'default' : 'secondary'}>
                              {slot.is_booked ? 'Booked' : 'Available'}
                            </Badge>
                            {slot.price && (
                              <div className="text-sm font-medium text-foreground mt-1">
                                {slot.discount_price ? (
                                  <div className="flex flex-col">
                                    <span className="line-through text-muted-foreground">£{slot.price}</span>
                                    <span className="text-destructive">£{slot.discount_price}</span>
                                  </div>
                                ) : (
                                  <span>£{slot.price}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {slot.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {!slot.is_booked && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <ServiceManager onServiceUpdate={fetchProviderServices} />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">My Bookings</h2>
            
            {myBookings.length === 0 ? (
              <Card className="card-elegant p-8 text-center">
                <p className="text-muted-foreground">No bookings yet.</p>
              </Card>
            ) : (
              myBookings.map((booking) => (
                <Card key={booking.id} className="card-elegant p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Customer: {booking.customer.name}
                          </p>
                        </div>
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

      {activeTab === 'library' && <LibraryTab />}

      {activeTab === 'profile' && <ProfileTab />}
    </div>
  );
};

export default ProviderDashboard;