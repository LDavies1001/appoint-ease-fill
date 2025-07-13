import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  User,
  LogOut,
  BookOpen
} from 'lucide-react';

interface AvailableSlot {
  id: string;
  provider_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  notes: string;
  provider: {
    name: string;
    business_name: string;
    location: string;
    rating: number;
  };
  service: {
    name: string;
    category: string;
  };
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  provider: {
    name: string;
    business_name: string;
  };
  service: {
    name: string;
  };
}

const CustomerDashboard = () => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
  }, []);

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select(`
          *,
          provider:profiles!availability_slots_provider_id_fkey(name, location),
          service:services(name, category)
        `)
        .eq('is_booked', false)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSlots = data?.map(slot => ({
        ...slot,
        provider: {
          name: slot.provider?.name || 'Unknown',
          business_name: slot.provider?.name || 'Unknown Business',
          location: slot.provider?.location || 'Unknown Location',
          rating: 0
        },
        service: {
          name: slot.service?.name || 'Unknown Service',
          category: slot.service?.category || 'Unknown'
        }
      })) || [];

      setAvailableSlots(formattedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({
        title: "Error loading available slots",
        variant: "destructive"
      });
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
          provider:profiles!bookings_provider_id_fkey(name),
          service:services(name)
        `)
        .eq('customer_id', profile?.user_id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedBookings = data?.map(booking => ({
        ...booking,
        provider: {
          name: booking.provider?.name || 'Unknown',
          business_name: booking.provider?.name || 'Unknown Business'
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

  const handleBookSlot = async (slot: AvailableSlot) => {
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: profile?.user_id,
          provider_id: slot.provider_id,
          slot_id: slot.id,
          service_id: slot.service_id,
          booking_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slot.id);

      if (slotError) throw slotError;

      toast({
        title: "Booking confirmed!",
        description: "Your appointment has been booked successfully",
      });

      // Refresh data
      fetchAvailableSlots();
      fetchMyBookings();
      setActiveTab('bookings');
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredSlots = availableSlots.filter(slot => {
    const matchesSearch = slot.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.provider.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || slot.service.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-foreground">FillMyHole</h1>
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
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'browse' ? 'hero' : 'ghost'}
            onClick={() => setActiveTab('browse')}
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Slots
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'hero' : 'ghost'}
            onClick={() => setActiveTab('bookings')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Bookings
          </Button>
        </div>

        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="card-elegant p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services, providers, or locations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Beauty">Beauty</SelectItem>
                    <SelectItem value="Cleaning">Cleaning</SelectItem>
                    <SelectItem value="Wellness">Wellness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Available Slots */}
            <div className="grid gap-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSlots.length === 0 ? (
                <Card className="card-elegant p-8 text-center">
                  <p className="text-muted-foreground">No available slots found.</p>
                </Card>
              ) : (
                filteredSlots.map((slot) => (
                  <Card key={slot.id} className="card-elegant p-4 hover:shadow-accent transition-smooth">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {slot.provider.business_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {slot.provider.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="mb-1">
                              {slot.service.name}
                            </Badge>
                            {slot.provider.rating > 0 && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                                {slot.provider.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(slot.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(slot.start_time)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {slot.provider.location}
                          </div>
                          <div className="font-medium text-foreground">
                            {slot.price ? `$${slot.price}` : 'Price TBD'}
                          </div>
                        </div>

                        {slot.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleBookSlot(slot)}
                      >
                        Book Now
                      </Button>
                    </div>
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
                <Button
                  variant="hero"
                  className="mt-4"
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Available Slots
                </Button>
              </Card>
            ) : (
              myBookings.map((booking) => (
                <Card key={booking.id} className="card-elegant p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {booking.provider.business_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.provider.name}
                          </p>
                        </div>
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(booking.start_time)}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {booking.service.name}
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

export default CustomerDashboard;