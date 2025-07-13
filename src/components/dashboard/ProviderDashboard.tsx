import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  X
} from 'lucide-react';

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
  service: {
    name: string;
  };
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
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state for adding slots
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({
    service_id: '',
    date: '',
    start_time: '',
    duration: 60,
    price: '',
    discount_price: '',
    notes: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [providerServices, setProviderServices] = useState<Array<{name: string, price: number}>>([]);
  
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
          service:services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSlots = data?.map(slot => ({
        ...slot,
        service: {
          name: slot.service?.name || 'Unknown Service'
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
        .from('provider_details')
        .select('pricing_info')
        .eq('user_id', profile?.user_id)
        .single();

      if (error) throw error;

      if (data?.pricing_info) {
        try {
          const services = JSON.parse(data.pricing_info);
          setProviderServices(services);
        } catch (parseError) {
          console.error('Error parsing pricing info:', parseError);
        }
      }
    } catch (error) {
      console.error('Error fetching provider services:', error);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!slotForm.service_id || !slotForm.date || !slotForm.start_time || !slotForm.price) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTime = new Date(`2000-01-01T${slotForm.start_time}`);
      const endTime = new Date(startTime.getTime() + slotForm.duration * 60000);
      
      const { error } = await supabase
        .from('availability_slots')
        .insert({
          provider_id: profile?.user_id,
          service_id: slotForm.service_id,
          date: slotForm.date,
          start_time: slotForm.start_time,
          end_time: endTime.toTimeString().slice(0, 5),
          duration: slotForm.duration,
          price: parseFloat(slotForm.price),
          discount_price: slotForm.discount_price ? parseFloat(slotForm.discount_price) : null,
          image_url: slotForm.image_url || null,
          notes: slotForm.notes
        });

      if (error) throw error;

      toast({
        title: "Slot added successfully!",
      });

      // Reset form
      setSlotForm({
        service_id: '',
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-foreground">Provider Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="card-elegant p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Today's Slots</p>
                <p className="text-2xl font-bold text-foreground">{todaysSlots.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-elegant p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-accent" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Bookings</p>
                <p className="text-2xl font-bold text-foreground">{upcomingBookings.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="card-elegant p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Slots</p>
                <p className="text-2xl font-bold text-foreground">{mySlots.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'slots' ? 'hero' : 'ghost'}
            onClick={() => setActiveTab('slots')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            My Slots
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'hero' : 'ghost'}
            onClick={() => setActiveTab('bookings')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Bookings
          </Button>
        </div>

        {activeTab === 'slots' && (
          <div className="space-y-6">
            {/* Add Slot Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Add a Slot</h2>
              {!showAddSlot && (
                <Button
                  variant="hero"
                  onClick={() => setShowAddSlot(!showAddSlot)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              )}
            </div>

            {/* Add Slot Form */}
            {showAddSlot && (
              <Card className="card-elegant p-6">
                <h3 className="text-lg font-semibold mb-4">Add New Slot</h3>
                <form onSubmit={handleAddSlot} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service">Service *</Label>
                      <Select 
                        value={slotForm.service_id} 
                        onValueChange={(value) => {
                          setSlotForm(prev => ({ ...prev, service_id: value }));
                          // Auto-fill price from provider's price list
                          const selectedService = providerServices.find(s => s.name === value);
                          if (selectedService) {
                            setSlotForm(prev => ({ ...prev, price: selectedService.price.toString() }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {providerServices.map((service, index) => (
                            <SelectItem key={index} value={service.name}>
                              {service.name} (£{service.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={slotForm.date}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={slotForm.duration}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        min="15"
                        step="15"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={slotForm.price}
                          onChange={(e) => setSlotForm(prev => ({ ...prev, price: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount_price">Discounted Price (optional)</Label>
                      <div className="relative">
                        <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="discount_price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={slotForm.discount_price}
                          onChange={(e) => setSlotForm(prev => ({ ...prev, discount_price: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Image (optional)</Label>
                    <div className="flex items-center gap-4">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 p-2 border border-border rounded-md hover:bg-muted/50">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">{uploading ? "Uploading..." : "Upload Image"}</span>
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
                        <div className="relative">
                          <img 
                            src={slotForm.image_url} 
                            alt="Slot" 
                            className="w-16 h-16 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0"
                            onClick={() => setSlotForm(prev => ({ ...prev, image_url: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any special notes about this slot..."
                      value={slotForm.notes}
                      onChange={(e) => setSlotForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddSlot(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="hero">
                      Add Slot
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Slots List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : mySlots.length === 0 ? (
                <Card className="card-elegant p-8 text-center">
                  <p className="text-muted-foreground">No slots created yet.</p>
                  <Button
                    variant="hero"
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
      </div>
    </div>
  );
};

export default ProviderDashboard;