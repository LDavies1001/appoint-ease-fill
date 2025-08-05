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
    <div className="w-full space-y-4 pb-20 bg-gradient-to-br from-background via-background/95 to-primary/5 min-h-screen">
      {/* Header with greeting */}
      <div className="text-center py-4 px-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 rounded-xl mx-3 border border-primary/20 shadow-soft">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Hello {profile?.name?.split(' ')[0] || 'there'} ✨
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find your perfect appointment today!
        </p>
      </div>

      {/* Quick Search - Most Important */}
      <div className="px-3">
        <Card className="p-4 bg-gradient-to-r from-background to-primary/5 border border-primary/20 shadow-soft">
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Find Available Slots</span>
          </h3>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services or businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full h-12">
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
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                {filteredSlots.length} slots available now
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-3 w-3 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="h-3 w-3 mr-1" />
                  Grid
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Available Slots - Always Visible */}
      <div className="px-3">
        <Card className="p-4 bg-gradient-to-r from-background to-primary/5 border border-primary/20 shadow-soft">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Available This Week</span>
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm mb-2">No slots found</p>
              <p className="text-xs">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 gap-3"
                : "space-y-3"
            }>
              {filteredSlots.slice(0, 8).map((slot) => 
                viewMode === 'grid' ? (
                  <Card key={slot.id} className="p-3 hover:shadow-medium transition-all duration-200 bg-gradient-to-br from-background to-primary/5 border border-primary/10">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate text-sm">
                            {slot.provider.business_name}
                          </h4>
                          <p className="text-xs text-primary font-medium truncate">
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
                        <div className="font-semibold text-sm">
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
                            <span className="text-primary">£{slot.price}</span>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleBookSlot(slot)}
                          size="sm"
                          className="text-xs px-2 h-7 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary"
                        >
                          Book
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card key={slot.id} className="p-4 hover:shadow-medium transition-all duration-200 bg-gradient-to-r from-background to-primary/5 border border-primary/10">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">
                            {slot.provider.business_name}
                          </h4>
                          <p className="text-sm text-primary font-medium truncate">
                            {slot.service.name}
                          </p>
                        </div>
                        {slot.provider.rating > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                            {slot.provider.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span className="truncate">{formatDate(slot.date)}</span>
                          <Clock className="h-4 w-4 ml-4 mr-1 text-primary flex-shrink-0" />
                          <span>{formatTime(slot.start_time)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span className="truncate">{slot.provider.location}</span>
                        </div>
                      </div>

                      {/* Price and Book Button */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="font-bold text-lg">
                          {slot.discount_price ? (
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground text-sm">
                                £{slot.price}
                              </span>
                              <span className="text-accent">
                                £{slot.discount_price}
                              </span>
                            </div>
                          ) : (
                            <span className="text-primary">£{slot.price}</span>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleBookSlot(slot)}
                          className="px-6 py-2 bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white font-medium shadow-medium"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              )}
            </div>
          )}
          
          {filteredSlots.length > 8 && (
            <div className="text-center mt-4">
              <Button variant="outline" className="border-primary/30 hover:bg-primary/10 text-primary">
                View {filteredSlots.length - 8} More Slots
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* My Upcoming Bookings - Always Visible */}
      <div className="px-3">
        <Card className="p-4 bg-gradient-to-r from-background to-accent/5 border border-accent/20 shadow-soft">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            <span>My Upcoming Bookings</span>
          </h3>
          
          {myBookings.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-accent/20 to-primary/20 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-accent" />
              </div>
              <p className="text-sm">No upcoming bookings</p>
              <p className="text-xs mt-1">Book your first appointment above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-start justify-between p-3 bg-gradient-to-r from-background to-accent/5 rounded-lg border border-accent/10 shadow-soft">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-accent to-primary"></div>
                      <p className="font-semibold text-sm text-foreground">{booking.service.name}</p>
                    </div>
                    <p className="text-sm text-accent font-medium">with {booking.provider.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(booking.start_time)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">£{booking.price}</p>
                    <Badge 
                      variant={booking.status === 'confirmed' ? 'default' : 'outline'} 
                      className={booking.status === 'confirmed' ? "bg-accent text-white border-accent" : "border-accent/50 text-accent"}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {myBookings.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{myBookings.length - 3} more bookings
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-3">
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 shadow-soft">
          <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 border-primary/30 hover:bg-primary/10 text-primary font-medium flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              My Favourites
            </Button>
            <Button
              variant="outline"
              className="h-12 border-accent/30 hover:bg-accent/10 text-accent font-medium flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              My Profile
            </Button>
          </div>
        </Card>
      </div>

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