import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import BookingModal from '@/components/booking/BookingModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';


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
  Percent,
  Building,
  Phone,
  Mail,
  Image,
  Settings,
  Grid3X3,
  List,
  LayoutGrid
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
    business_category?: string;
  };
  service: {
    name: string;
    category: string;
  };
  provider_service?: {
    service_name: string;
    description?: string;
    base_price?: number;
  } | null;
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

interface FavouriteBusiness {
  id: string;
  provider_id: string;
  provider: {
    name: string;
    business_name: string;
    location: string;
    rating: number;
    business_email: string;
    business_phone: string;
    business_category: string;
  };
}

interface LocalOffer {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  discount_amount: number;
  offer_code: string;
  min_spend: number;
  valid_until: string;
  max_uses: number;
  current_uses: number;
  provider: {
    name: string;
    business_name: string;
    location: string;
  };
}

const CustomerDashboard = () => {
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [favouriteBusinesses, setFavouriteBusinesses] = useState<FavouriteBusiness[]>([]);
  const [localOffers, setLocalOffers] = useState<LocalOffer[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('list');
  
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableSlots();
    fetchMyBookings();
    fetchFavouriteBusinesses();
    fetchLocalOffers();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Get categories from services table
      const { data: serviceCategories, error: serviceError } = await supabase
        .from('services')
        .select('category')
        .not('category', 'is', null);

      if (serviceError) throw serviceError;

      // Get categories from business_categories table
      const { data: businessCategories, error: businessError } = await supabase
        .from('business_categories')
        .select('name');

      if (businessError) throw businessError;

      // Combine and get unique categories
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

      // Also fetch provider details and business info for each slot
      const formattedSlots = await Promise.all((data || []).map(async (slot) => {
        // Get provider business details including business category
        const { data: providerDetails } = await supabase
          .from('provider_details')
          .select(`
            business_name, 
            business_email, 
            business_phone, 
            rating, 
            business_description,
            business_category:business_categories(name)
          `)
          .eq('user_id', slot.provider_id)
          .single();

        return {
          ...slot,
          provider: {
            name: slot.provider?.name || 'Unknown',
            business_name: providerDetails?.business_name || slot.provider?.name || 'Unknown Business',
            location: slot.provider?.location || 'Unknown Location',
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

  const fetchFavouriteBusinesses = async () => {
    try {
      // First get the favourites with provider info
      const { data: favourites, error: favError } = await supabase
        .from('customer_favourites')
        .select('*, provider:profiles!customer_favourites_provider_id_fkey(name, location)')
        .eq('customer_id', profile?.user_id);

      if (favError) throw favError;

      // Then get provider details for each favourite
      const formattedFavourites = await Promise.all((favourites || []).map(async (fav) => {
        const { data: providerDetails } = await supabase
          .from('provider_details')
          .select('business_name, business_email, business_phone, business_category, rating')
          .eq('user_id', fav.provider_id)
          .single();

        return {
          ...fav,
          provider: {
            name: fav.provider?.name || 'Unknown',
            business_name: providerDetails?.business_name || 'Unknown Business',
            location: fav.provider?.location || 'Unknown Location',
            rating: providerDetails?.rating || 0,
            business_email: providerDetails?.business_email || '',
            business_phone: providerDetails?.business_phone || '',
            business_category: providerDetails?.business_category || ''
          }
        };
      }));

      setFavouriteBusinesses(formattedFavourites);
    } catch (error) {
      console.error('Error fetching favourite businesses:', error);
    }
  };

  const fetchLocalOffers = async () => {
    try {
      // Get offers with provider info
      const { data: offers, error: offerError } = await supabase
        .from('local_offers')
        .select('*, provider:profiles!local_offers_provider_id_fkey(name, location)')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .order('valid_until', { ascending: true });

      if (offerError) throw offerError;

      // Then get provider details for each offer
      const formattedOffers = await Promise.all((offers || []).map(async (offer) => {
        const { data: providerDetails } = await supabase
          .from('provider_details')
          .select('business_name')
          .eq('user_id', offer.provider_id)
          .single();

        return {
          ...offer,
          provider: {
            name: offer.provider?.name || 'Unknown',
            business_name: providerDetails?.business_name || 'Unknown Business',
            location: offer.provider?.location || 'Unknown Location'
          }
        };
      }));

      setLocalOffers(formattedOffers);
    } catch (error) {
      console.error('Error fetching local offers:', error);
    }
  };

  const handleBookSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    toast({
      title: "Booking confirmed!",
      description: "Your appointment has been booked successfully",
    });
    setBookingModalOpen(false);
    setSelectedSlot(null);
    fetchAvailableSlots();
    fetchMyBookings();
    setActiveTab('bookings');
  };

  const filteredSlots = availableSlots.filter(slot => {
    const matchesSearch = slot.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.provider.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         slot.provider.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Debug logging
    console.log('Slot:', slot.id, 'Service category:', slot.service.category, 'Business category:', slot.provider.business_category, 'Selected category:', selectedCategory);
    
    // Check if the selected category matches either the service category OR the business category
    const matchesCategory = selectedCategory === 'all' || 
                           slot.service.category === selectedCategory ||
                           slot.provider.business_category === selectedCategory;
    
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
    <div className="space-y-6">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 mb-8">
          <Button
            variant={activeTab === 'browse' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('browse')}
            className={activeTab === 'browse' ? 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-lg transition-all' : 'hover:bg-primary/20 hover:text-primary-foreground'}
          >
            <Search className="h-4 w-4 mr-2" />
            Browse Slots
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('bookings')}
            className={activeTab === 'bookings' ? 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-lg transition-all' : 'hover:bg-primary/20 hover:text-primary-foreground'}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Bookings
          </Button>
          <Button
            variant={activeTab === 'favourites' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('favourites')}
            className={activeTab === 'favourites' ? 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-lg transition-all' : 'hover:bg-primary/20 hover:text-primary-foreground'}
          >
            <Heart className="h-4 w-4 mr-2" />
            Favourites
          </Button>
          <Button
            variant={activeTab === 'offers' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('offers')}
            className={activeTab === 'offers' ? 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-lg transition-all' : 'hover:bg-primary/20 hover:text-primary-foreground'}
          >
            <Tag className="h-4 w-4 mr-2" />
            Local Offers
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('profile')}
            className={activeTab === 'profile' ? 'bg-primary text-primary-foreground hover:bg-primary/80 hover:shadow-lg transition-all' : 'hover:bg-primary/20 hover:text-primary-foreground'}
          >
            <Settings className="h-4 w-4 mr-2" />
            Profile
          </Button>
        </div>

        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="card-elegant p-4">
              <div className="flex flex-col gap-4">
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
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {filteredSlots.length} slots available
                  </span>
                  <div className="flex gap-1 bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 px-3"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">List</span>
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 px-3"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Grid</span>
                    </Button>
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compact')}
                      className="h-8 px-3"
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Compact</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Available Slots */}
            <div className={`gap-4 ${
              viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' :
              viewMode === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
              'flex flex-col'
            }`}>
              {loading ? (
                <div className="flex justify-center py-8 col-span-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSlots.length === 0 ? (
                <Card className="card-elegant p-8 text-center col-span-full">
                  <p className="text-muted-foreground">No available slots found.</p>
                </Card>
              ) : (
                filteredSlots.map((slot) => {
                  if (viewMode === 'compact') {
                    return (
                      <Card key={slot.id} className="card-elegant p-4 hover:shadow-accent transition-smooth">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-foreground truncate">
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
                          
                          <div className="space-y-2 text-xs text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span className="truncate">{formatDate(slot.date)}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{formatTime(slot.start_time)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{slot.provider.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
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
                                `£${slot.price || 'TBD'}`
                              )}
                            </div>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => handleBookSlot(slot)}
                              className="h-8 px-3 text-xs"
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  
                  if (viewMode === 'grid') {
                    return (
                      <Card key={slot.id} className="card-elegant p-4 hover:shadow-accent transition-smooth">
                        {slot.image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden">
                            <img 
                              src={slot.image_url} 
                              alt={slot.service.name}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">
                                {slot.provider.business_name}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {slot.provider.name}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-xs">
                                {slot.service.name}
                              </Badge>
                              {slot.provider.rating > 0 && (
                                <div className="flex items-center text-sm text-muted-foreground mt-1">
                                  <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
                                  {slot.provider.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {formatDate(slot.date)}
                                </div>
                                <div className="text-xs">
                                  {slot.duration} minutes
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {formatTime(slot.start_time)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              <div className="font-medium text-foreground truncate">
                                {slot.provider.location}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="font-semibold text-lg text-foreground">
                              {slot.discount_price ? (
                                <div>
                                  <span className="line-through text-muted-foreground text-sm">
                                    £{slot.price}
                                  </span>
                                  <span className="text-accent ml-2">
                                    £{slot.discount_price}
                                  </span>
                                </div>
                              ) : (
                                `£${slot.price || 'TBD'}`
                              )}
                            </div>
                            <Button
                              variant="accent"
                              size="sm"
                              onClick={() => handleBookSlot(slot)}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  }
                  
                  // Default list view (existing layout)
                  return (
                    <Card key={slot.id} className="card-elegant p-6 hover:shadow-accent transition-smooth">
                      
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-foreground">
                                {slot.provider.business_name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {slot.provider.name}
                              </p>
                              {slot.provider.business_description && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  {slot.provider.business_description}
                                </p>
                              )}
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

                          {/* Service Details */}
                          {slot.provider_service && (
                            <div className="bg-muted/30 rounded-lg p-3 mb-4">
                              <h4 className="font-medium text-sm text-foreground mb-1">
                                Service: {slot.provider_service.service_name}
                              </h4>
                              {slot.provider_service.description && (
                                <p className="text-sm text-muted-foreground">
                                  {slot.provider_service.description}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Date, Time, Location, Price Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {formatDate(slot.date)}
                                </div>
                                <div className="text-xs">
                                  {slot.duration} minutes
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {formatTime(slot.start_time)}
                                </div>
                                <div className="text-xs">
                                  Ends {formatTime(slot.end_time)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              <div>
                                <div className="font-medium text-foreground">
                                  {slot.provider.location}
                                </div>
                                {slot.provider.business_phone && (
                                  <div className="text-xs flex items-center mt-1">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {slot.provider.business_phone}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div>
                                <div className="font-semibold text-lg text-foreground">
                                  {slot.discount_price ? (
                                    <div>
                                      <span className="line-through text-muted-foreground text-sm">
                                        £{slot.price}
                                      </span>
                                      <span className="text-accent ml-2">
                                        £{slot.discount_price}
                                      </span>
                                    </div>
                                  ) : (
                                    `£${slot.price || 'TBD'}`
                                  )}
                                </div>
                                {slot.discount_price && (
                                  <div className="text-xs text-accent font-medium">
                                    Save £{slot.price - slot.discount_price}!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Contact Information */}
                          {slot.provider.business_email && (
                            <div className="flex items-center text-sm text-muted-foreground mb-3">
                              <Mail className="h-4 w-4 mr-2" />
                              {slot.provider.business_email}
                            </div>
                          )}

                          {/* Special Notes */}
                          {slot.notes && (
                            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4">
                              <h5 className="font-medium text-sm text-foreground mb-1">Special Notes:</h5>
                              <p className="text-sm text-muted-foreground">
                                {slot.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-border">
                        <Button
                          size="lg"
                          onClick={() => handleBookSlot(slot)}
                          className="min-w-32 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white"
                        >
                          Book Now
                        </Button>
                      </div>
                    </Card>
                  );
                })
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

        {activeTab === 'favourites' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Favourite Businesses</h2>
            
            {favouriteBusinesses.length === 0 ? (
              <Card className="card-elegant p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No favourite businesses yet.</p>
                <Button
                  variant="hero"
                  className="mt-4"
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Providers
                </Button>
              </Card>
            ) : (
              favouriteBusinesses.map((favourite) => (
                <Card key={favourite.id} className="card-elegant p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {favourite.provider.business_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {favourite.provider.name}
                          </p>
                        </div>
                        {favourite.provider.rating > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                            {favourite.provider.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {favourite.provider.location}
                        </div>
                        {favourite.provider.business_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {favourite.provider.business_phone}
                          </div>
                        )}
                        {favourite.provider.business_email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {favourite.provider.business_email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Local Offers & Discounts</h2>
            
            {localOffers.length === 0 ? (
              <Card className="card-elegant p-8 text-center">
                <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No local offers available at the moment.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back later for new deals from local providers!
                </p>
              </Card>
            ) : (
              localOffers.map((offer) => (
                <Card key={offer.id} className="card-elegant p-4 border-l-4 border-l-accent">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground flex items-center">
                            {offer.title}
                            {offer.discount_percentage && (
                              <Badge variant="destructive" className="ml-2">
                                -{offer.discount_percentage}% OFF
                              </Badge>
                            )}
                            {offer.discount_amount && (
                              <Badge variant="destructive" className="ml-2">
                                ${offer.discount_amount} OFF
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {offer.provider.business_name}
                          </p>
                        </div>
                        <div className="text-right">
                          {offer.offer_code && (
                            <Badge variant="outline" className="font-mono">
                              {offer.offer_code}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {offer.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {offer.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {offer.provider.location}
                        </div>
                        {offer.min_spend && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            Min spend: ${offer.min_spend}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Until {formatDate(offer.valid_until)}
                        </div>
                        {offer.max_uses && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {offer.current_uses}/{offer.max_uses} used
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        

        {activeTab === 'profile' && <ProfileTab />}
      </div>

      {/* Booking Modal */}
      {selectedSlot && (
        <BookingModal
          isOpen={bookingModalOpen}
          onClose={() => {
            setBookingModalOpen(false);
            setSelectedSlot(null);
          }}
          slot={{
            id: selectedSlot.id,
            date: selectedSlot.date,
            start_time: selectedSlot.start_time,
            end_time: selectedSlot.end_time,
            price: selectedSlot.price,
            discount_price: selectedSlot.discount_price,
            duration: selectedSlot.duration,
            provider_id: selectedSlot.provider_id,
            provider: selectedSlot.provider,
            provider_service: selectedSlot.provider_service,
            service: selectedSlot.service,
            notes: selectedSlot.notes
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;