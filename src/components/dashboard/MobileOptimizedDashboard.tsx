import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import BookingModal from '@/components/booking/BookingModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

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
  LogOut,
  BookOpen,
  Heart,
  Tag,
  Phone,
  Settings,
  MoreVertical,
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

interface LocalOffer {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  valid_until: string;
  provider: {
    name: string;
    business_name: string;
    location: string;
  };
}

const MobileOptimizedDashboard = () => {
  console.log('MobileOptimizedDashboard - Component rendering');
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [favouriteBusinesses, setFavouriteBusinesses] = useState<FavouriteBusiness[]>([]);
  const [localOffers, setLocalOffers] = useState<LocalOffer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  
  console.log('MobileOptimizedDashboard - State:', { 
    profile: !!profile,
    profileId: profile?.user_id,
    profileName: profile?.name,
    profileRole: profile?.role,
    profileActiveRole: profile?.active_role,
    loading,
    availableSlotsCount: availableSlots.length,
    categoriesCount: categories.length,
    bookingsCount: myBookings.length
  });

  // Safety check - if no profile, show loading or error
  if (!profile) {
    console.log('MobileOptimizedDashboard - No profile found');
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
    fetchFavouriteBusinesses();
    fetchLocalOffers();
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
      
      // Map the data to match our interface
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
      // Note: Since favourite_businesses table doesn't exist in the schema, 
      // we'll just set an empty array for now
      setFavouriteBusinesses([]);
    } catch (error) {
      console.error('Error fetching favourites:', error);
    }
  };

  const fetchLocalOffers = async () => {
    try {
      // Note: Since local_offers table doesn't exist in the schema, 
      // we'll just set an empty array for now
      setLocalOffers([]);
    } catch (error) {
      console.error('Error fetching offers:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Welcome, {profile?.name || 'User'}
            </h1>
            <p className="text-sm text-muted-foreground">Find your next appointment</p>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="space-y-4 mt-6">
                <Button
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="browse" className="w-full">
          {/* Mobile-First Tab Navigation */}
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="browse" className="text-xs px-2 flex flex-col gap-1">
              <Search className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs px-2 flex flex-col gap-1">
              <BookOpen className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="favourites" className="text-xs px-2 flex flex-col gap-1">
              <Heart className="h-4 w-4" />
              Favourites
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs px-2 flex flex-col gap-1">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4">
            {/* Search Section */}
            <Card className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services or providers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
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
                <div className="text-sm text-muted-foreground">
                  {filteredSlots.length} slots available
                </div>
              </div>
            </Card>

            {/* Slots List - Mobile Optimized */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSlots.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No available slots found.</p>
                </Card>
              ) : (
                filteredSlots.map((slot) => (
                  <Card key={slot.id} className="p-4 hover:shadow-md transition-all">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {slot.provider.business_name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
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

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2 text-primary" />
                          <span className="truncate">{formatDate(slot.date)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-2 text-primary" />
                          <span>{formatTime(slot.start_time)}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground col-span-2">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span className="truncate">{slot.provider.location}</span>
                        </div>
                      </div>

                      {/* Price and Book Button */}
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg text-foreground">
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
                            `£${slot.price || 'TBD'}`
                          )}
                        </div>
                        <Button
                          onClick={() => handleBookSlot(slot)}
                          className="h-9 px-6"
                        >
                          Book Now
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {myBookings.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {booking.service?.name || 'Service'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.provider?.name || 'Unknown Provider'}
                          </p>
                        </div>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(booking.start_time)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">£{booking.price}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favourites Tab */}
          <TabsContent value="favourites" className="space-y-4">
            {favouriteBusinesses.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No favourite businesses yet.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {favouriteBusinesses.map((fav) => (
                  <Card key={fav.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {fav.provider.business_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {fav.provider.business_category}
                          </p>
                        </div>
                        {fav.provider.rating > 0 && (
                          <div className="flex items-center text-sm">
                            <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                            {fav.provider.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        {fav.provider.location}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        slot={selectedSlot}
      />
    </div>
  );
};

export default MobileOptimizedDashboard;