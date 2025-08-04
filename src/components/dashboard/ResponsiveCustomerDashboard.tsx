import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import BookingModal from '@/components/booking/BookingModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ProfileTab from './ProfileTab';
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
  BookOpen,
  Heart,
  Tag,
  Phone,
  Settings,
  Grid3X3,
  List,
  ChevronRight
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
  discount_price?: number;
  notes: string;
  image_url?: string;
  custom_service_name?: string;
  provider: {
    name: string;
    business_name: string;
    location: string;
    rating: number;
    business_email: string;
    business_phone: string;
    business_description: string;
    business_category: string;
  };
  service: {
    name: string;
    category: string;
  };
  provider_service: {
    service_name: string;
    description: string;
    base_price: number;
  } | null;
}

interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  notes: string;
  provider: {
    name: string;
  };
  service: {
    name: string;
  };
}

interface FavouriteBusiness {
  id: string;
  user_id: string;
  provider_id: string;
  provider: {
    name: string;
    location: string;
    rating: number;
    business_name: string;
    business_description: string;
    business_category: string;
  };
}

const ResponsiveCustomerDashboard = () => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [favouriteBusinesses, setFavouriteBusinesses] = useState<FavouriteBusiness[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
    fetchFavouriteBusinesses();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: serviceCategories, error: serviceError } = await supabase
        .from('services')
        .select('category')
        .not('category', 'is', null);

      if (serviceError) throw serviceError;

      const { data: businessCategories, error: businessError } = await supabase
        .from('business_categories')
        .select('name');

      if (businessError) throw businessError;

      const allCategories = [
        ...serviceCategories.map(item => item.category),
        ...businessCategories.map(item => item.name)
      ];
      const uniqueCategories = [...new Set(allCategories)].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select(`
          *,
          provider:profiles!availability_slots_provider_id_fkey(name, location),
          service:services(name, category),
          provider_service:provider_services(service_name, description, base_price)
        `)
        .eq('is_booked', false)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSlots = await Promise.all((data || []).map(async (slot) => {
        const { data: providerDetails } = await supabase
          .from('provider_details')
          .select(`
            business_name, 
            business_email, 
            business_phone, 
            rating, 
            business_description,
            formatted_address,
            business_postcode,
            business_category:business_categories(name)
          `)
          .eq('user_id', slot.provider_id)
          .single();

        return {
          ...slot,
          provider: {
            name: slot.provider?.name || 'Unknown',
            business_name: providerDetails?.business_name || slot.provider?.name || 'Unknown Business',
            location: providerDetails?.formatted_address || providerDetails?.business_postcode || slot.provider?.location || 'Location not specified',
            rating: providerDetails?.rating || 0,
            business_email: providerDetails?.business_email || '',
            business_phone: providerDetails?.business_phone || '',
            business_description: providerDetails?.business_description || '',
            business_category: providerDetails?.business_category?.name || ''
          },
          service: {
            name: slot.provider_service?.service_name || slot.service?.name || slot.custom_service_name || 'Unknown Service',
            category: slot.service?.category || 'Unknown'
          },
          provider_service: slot.provider_service || null
        };
      }));

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
        .order('booking_date', { ascending: true });

      if (error) throw error;
      
      const formattedBookings = (data || []).map(booking => ({
        ...booking,
        notes: booking.customer_notes || booking.provider_notes || '',
        provider: booking.provider || { name: 'Unknown Provider' },
        service: booking.service || { name: 'Unknown Service' }
      }));
      
      setMyBookings(formattedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchFavouriteBusinesses = async () => {
    try {
      setFavouriteBusinesses([]);
    } catch (error) {
      console.error('Error fetching favourites:', error);
    }
  };

  const handleBookSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setBookingModalOpen(true);
  };

  const handleBookingConfirm = async () => {
    try {
      await fetchAvailableSlots();
      await fetchMyBookings();
      setBookingModalOpen(false);
      toast({
        title: "Booking confirmed!",
        description: "Your appointment has been successfully booked."
      });
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast({
        title: "Error confirming booking",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const filteredSlots = availableSlots.filter((slot) => {
    const matchesSearch = searchTerm === '' || 
      slot.provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.provider.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      slot.service.category === selectedCategory ||
      slot.provider.business_category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const SlotCard = ({ slot }: { slot: AvailableSlot }) => (
    <Card className="p-3 hover:shadow-md transition-all border-muted/50">
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate text-sm">
              {slot.provider.business_name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {slot.service.name}
            </p>
          </div>
          {slot.provider.rating > 0 && (
            <div className="flex items-center text-xs text-muted-foreground ml-2">
              <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
              {slot.provider.rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3 w-3 mr-2 text-primary flex-shrink-0" />
            <span className="truncate">{formatDate(slot.date)}</span>
            <Clock className="h-3 w-3 ml-3 mr-1 text-primary flex-shrink-0" />
            <span>{formatTime(slot.start_time)}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-3 w-3 mr-2 text-primary flex-shrink-0" />
            <span className="truncate">{slot.provider.location}</span>
          </div>
        </div>

        {/* Price and Book Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="font-semibold text-sm text-foreground">
            {slot.discount_price ? (
              <div className="flex items-center gap-1">
                <span className="line-through text-muted-foreground text-xs">
                  £{slot.price}
                </span>
                <span className="text-accent">
                  £{slot.discount_price}
                </span>
              </div>
            ) : (
              <span>£{slot.price}</span>
            )}
          </div>
          <Button 
            onClick={() => handleBookSlot(slot)}
            size="sm"
            className="text-xs px-3 h-7"
          >
            Book
          </Button>
        </div>
      </div>
    </Card>
  );

  const GridSlotCard = ({ slot }: { slot: AvailableSlot }) => (
    <Card className="p-3 hover:shadow-md transition-all">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate text-xs">
              {slot.provider.business_name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {slot.service.name}
            </p>
          </div>
          {slot.provider.rating > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
              {slot.provider.rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1 text-primary" />
            <span className="truncate">{formatDate(slot.date)}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3 w-3 mr-1 text-primary" />
            <span>{formatTime(slot.start_time)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold text-sm text-foreground">
            £{slot.discount_price || slot.price}
          </span>
          <Button 
            onClick={() => handleBookSlot(slot)}
            size="sm"
            className="text-xs px-2"
          >
            Book
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="browse" className="w-full">
        {/* Mobile-First Tab Navigation */}
        <TabsList className="grid w-full grid-cols-4 mb-3 h-auto bg-muted/50">
          <TabsTrigger value="browse" className="text-xs px-2 py-2 flex flex-col gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Search className="h-4 w-4" />
            <span>Browse</span>
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs px-2 py-2 flex flex-col gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BookOpen className="h-4 w-4" />
            <span>My Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="favourites" className="text-xs px-2 py-2 flex flex-col gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Heart className="h-4 w-4" />
            <span>Favourites</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs px-2 py-2 flex flex-col gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-3">
          {/* Search and Filters */}
          <Card className="p-3 border-muted/50">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {filteredSlots.length} slots found
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 px-2"
                  >
                    <List className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 px-2"
                  >
                    <Grid3X3 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Slots List/Grid */}
          <div className="min-h-96">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSlots.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No available slots found.</p>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid' && window.innerWidth >= 640
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
                  : "space-y-3"
              }>
                {filteredSlots.map((slot) => 
                  viewMode === 'grid' && window.innerWidth >= 640 ? (
                    <GridSlotCard key={slot.id} slot={slot} />
                  ) : (
                    <SlotCard key={slot.id} slot={slot} />
                  )
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
            <ScrollArea className="h-96">
              {myBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No bookings found.</p>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{booking.service.name}</h4>
                            <p className="text-sm text-muted-foreground">with {booking.provider.name}</p>
                          </div>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
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
                            {formatTime(booking.start_time)}
                          </div>
                        </div>
                        <div className="text-sm font-medium">£{booking.price}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Favourites Tab */}
        <TabsContent value="favourites" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Favourite Businesses</h3>
            <ScrollArea className="h-96">
              {favouriteBusinesses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No favourites yet.</p>
              ) : (
                <div className="space-y-3">
                  {favouriteBusinesses.map((business) => (
                    <Card key={business.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{business.provider.business_name}</h4>
                            <p className="text-sm text-muted-foreground">{business.provider.business_category}</p>
                          </div>
                          {business.provider.rating > 0 && (
                            <div className="flex items-center text-sm">
                              <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                              {business.provider.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {business.provider.location}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          slot={selectedSlot}
          onBookingSuccess={handleBookingConfirm}
        />
      )}
    </div>
  );
};

export default ResponsiveCustomerDashboard;