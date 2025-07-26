import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Star, Filter, Search, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface SlotData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  custom_service_name?: string;
  provider_id: string;
  provider_details?: {
    business_name?: string;
    business_address?: string;
    business_city?: string;
    business_postcode?: string;
    rating?: number;
    total_reviews?: number;
  };
  profiles?: {
    name?: string;
    avatar_url?: string;
  };
}

const SlotCard: React.FC<{ slot: SlotData; onBook: (slot: SlotData) => void }> = ({ slot, onBook }) => {
  const businessName = slot.provider_details?.business_name || slot.profiles?.name || 'Business';
  const location = slot.provider_details?.business_city || 'Location';
  const rating = slot.provider_details?.rating || 0;
  const reviewCount = slot.provider_details?.total_reviews || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/20 bg-gradient-to-br from-white to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {businessName}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4 text-foreground/70" />
              <span className="text-sm text-foreground font-semibold">{location}</span>
            </div>
            {rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
                <span className="text-sm text-foreground/70 font-medium">({reviewCount} reviews)</span>
              </div>
            )}
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {slot.custom_service_name || 'Service'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-bold text-foreground">{new Date(slot.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-foreground/70" />
            <span className="text-sm font-bold text-foreground">{slot.start_time} - {slot.end_time}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-foreground">
              £{slot.price}
            </div>
            <Button 
              onClick={() => onBook(slot)}
              className="bg-primary hover:bg-primary/90 text-foreground font-semibold px-6"
            >
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SlotDiscovery: React.FC = () => {
  const { user } = useAuth();
  const { showSuccessToast, showErrorToast } = useNotifications();
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  // Load available slots
  const loadSlots = async () => {
    try {
      setLoading(true);
      
      // First get slots
      let slotsQuery = supabase
        .from('availability_slots')
        .select('*')
        .eq('is_booked', false)
        .gte('date', new Date().toISOString().split('T')[0]);

      // Apply time range filter
      if (selectedTimeRange !== 'all') {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        if (selectedTimeRange === 'today') {
          slotsQuery = slotsQuery.eq('date', today);
        } else if (selectedTimeRange === 'tomorrow') {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          slotsQuery = slotsQuery.eq('date', tomorrow.toISOString().split('T')[0]);
        } else if (selectedTimeRange === 'week') {
          const weekFromNow = new Date(now);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          slotsQuery = slotsQuery.lte('date', weekFromNow.toISOString().split('T')[0]);
        }
      }

      // Apply sorting
      if (sortBy === 'date') {
        slotsQuery = slotsQuery.order('date', { ascending: true }).order('start_time', { ascending: true });
      } else if (sortBy === 'price') {
        slotsQuery = slotsQuery.order('price', { ascending: true });
      }

      const { data: slotsData, error: slotsError } = await slotsQuery.limit(20);

      if (slotsError) {
        console.error('Error loading slots:', slotsError);
        showErrorToast('Failed to load available slots');
        return;
      }

      if (!slotsData || slotsData.length === 0) {
        setSlots([]);
        return;
      }

      // Get provider details for each slot
      const providerIds = [...new Set(slotsData.map(slot => slot.provider_id))];
      
      const { data: providerDetailsData, error: providerError } = await supabase
        .from('provider_details')
        .select('user_id, business_name, business_address, business_city, business_postcode, rating, total_reviews')
        .in('user_id', providerIds);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', providerIds);

      if (providerError || profilesError) {
        console.error('Error loading provider data:', providerError || profilesError);
      }

      // Combine data
      const enrichedSlots = slotsData.map(slot => {
        const providerDetails = providerDetailsData?.find(pd => pd.user_id === slot.provider_id);
        const profile = profilesData?.find(p => p.user_id === slot.provider_id);
        
        // Apply location filter if provided
        if (searchLocation.trim()) {
          const locationLower = searchLocation.toLowerCase();
          const cityMatch = providerDetails?.business_city?.toLowerCase().includes(locationLower);
          const postcodeMatch = providerDetails?.business_postcode?.toLowerCase().includes(locationLower);
          
          if (!cityMatch && !postcodeMatch) {
            return null;
          }
        }
        
        return {
          ...slot,
          provider_details: providerDetails,
          profiles: profile
        };
      }).filter(Boolean) as SlotData[];

      setSlots(enrichedSlots);
    } catch (error) {
      console.error('Error in loadSlots:', error);
      showErrorToast('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  // Handle slot booking
  const handleBookSlot = async (slot: SlotData) => {
    if (!user) {
      showErrorToast('Please sign in to book appointments');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          customer_id: user.id,
          provider_id: slot.provider_id,
          slot_id: slot.id,
          service_id: slot.id, // Using slot id as service reference for now
          booking_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.price,
          status: 'pending'
        });

      if (error) {
        console.error('Booking error:', error);
        showErrorToast('Failed to book appointment');
        return;
      }

      // Mark slot as booked
      await supabase
        .from('availability_slots')
        .update({ is_booked: true })
        .eq('id', slot.id);

      showSuccessToast('Appointment booked successfully!');
      
      // Refresh slots to remove booked slot
      loadSlots();
    } catch (error) {
      console.error('Error booking slot:', error);
      showErrorToast('Failed to book appointment');
    }
  };

  useEffect(() => {
    loadSlots();
  }, [searchLocation, selectedCategory, selectedTimeRange, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      {/* Hero Section */}
      <div className="bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-background">
              Find Your Perfect Slot
            </h1>
            <p className="text-lg text-background/80 max-w-2xl mx-auto font-medium">
              Discover available last-minute appointments with local beauty professionals near you
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter your postcode or area..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="pl-10 h-12 text-foreground font-medium focus:border-primary/30 focus:ring-primary/20"
                  />
                </div>
              </div>
              
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="md:w-48 h-12 text-foreground font-medium focus:border-primary/30 focus:ring-primary/20">
                  <SelectValue placeholder="When?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="md:w-48 h-12 text-foreground font-medium focus:border-primary/30 focus:ring-primary/20">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Earliest first</SelectItem>
                  <SelectItem value="price">Price: Low to high</SelectItem>
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:w-auto h-12 text-foreground font-medium hover:bg-primary/5 hover:border-primary/30">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filter Results</SheetTitle>
                    <SheetDescription>
                      Refine your search to find the perfect appointment
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 mt-6">
                     <div>
                       <label className="text-sm font-bold mb-3 block text-foreground">Service Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All categories</SelectItem>
                          <SelectItem value="nails">Nails</SelectItem>
                          <SelectItem value="lashes">Lashes</SelectItem>
                          <SelectItem value="brows">Brows</SelectItem>
                          <SelectItem value="hair">Hair</SelectItem>
                          <SelectItem value="massage">Massage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-foreground font-bold">Finding available slots...</p>
            </div>
        ) : slots.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {slots.length} Available Slot{slots.length !== 1 ? 's' : ''} Found
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onBook={handleBookSlot}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No slots found near you
            </h3>
            <p className="text-foreground/70 font-semibold mb-6">
              Try expanding your search area or adjusting your filters
            </p>
            <Button 
              onClick={loadSlots}
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              Refresh Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotDiscovery;