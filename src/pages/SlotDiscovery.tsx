import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Star, Filter, Search, Calendar, ExternalLink } from 'lucide-react';
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
  const navigate = useNavigate();
  const businessName = slot.provider_details?.business_name || slot.profiles?.name || 'Business';
  const location = slot.provider_details?.business_city || 'Location';
  const rating = slot.provider_details?.rating || 0;
  const reviewCount = slot.provider_details?.total_reviews || 0;

  return (
    <Card className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-primary/10 hover:border-muted-foreground/40 bg-gradient-to-br from-white to-primary/5 hover:from-white hover:to-primary/10 hover:scale-[1.02] cursor-pointer">
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
          <Badge variant="secondary" className="bg-foreground/10 text-foreground border-foreground/20 font-semibold">
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
          <div className="flex items-center justify-between gap-2">
            <div className="text-lg font-bold text-foreground">
              £{slot.price}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/business/${slot.provider_id}/view`);
                }}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Business
              </Button>
              <Button 
                onClick={() => onBook(slot)}
                className="bg-primary hover:bg-primary/90 text-foreground font-semibold px-6 group-hover:scale-105 transition-transform duration-300"
              >
                Book Now
              </Button>
            </div>
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
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState<string>('all');
  const [selectedDistance, setSelectedDistance] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [appliedFilters, setAppliedFilters] = useState<Array<{id: string, label: string, type: string}>>([]);
  const [autoDetectingLocation, setAutoDetectingLocation] = useState(false);

  // Auto-detect location
  const handleAutoDetectLocation = () => {
    setAutoDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For demo purposes, we'll set a generic location
          // In production, you'd use reverse geocoding API
          setSearchLocation('Current Location');
          setAutoDetectingLocation(false);
          showSuccessToast('Location detected successfully');
        },
        (error) => {
          setAutoDetectingLocation(false);
          showErrorToast('Unable to detect location. Please enter manually.');
        }
      );
    } else {
      setAutoDetectingLocation(false);
      showErrorToast('Geolocation is not supported by this browser.');
    }
  };

  // Update applied filters
  const updateAppliedFilters = () => {
    const filters = [];
    if (selectedCategory !== 'all') {
      filters.push({ id: 'category', label: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1), type: 'category' });
    }
    if (selectedTimeRange !== 'all') {
      const timeLabels = { today: 'Today', tomorrow: 'Tomorrow', week: 'This Week' };
      filters.push({ id: 'timeRange', label: timeLabels[selectedTimeRange as keyof typeof timeLabels], type: 'timeRange' });
    }
    if (selectedTimeOfDay !== 'all') {
      const timeOfDayLabels = { morning: 'Morning (6AM-12PM)', afternoon: 'Afternoon (12PM-6PM)', evening: 'Evening (6PM-10PM)' };
      filters.push({ id: 'timeOfDay', label: timeOfDayLabels[selectedTimeOfDay as keyof typeof timeOfDayLabels], type: 'timeOfDay' });
    }
    if (selectedDistance !== 'all') {
      const distanceLabels = { '1': 'Within 1 mile', '5': 'Within 5 miles', '10': 'Within 10 miles' };
      filters.push({ id: 'distance', label: distanceLabels[selectedDistance as keyof typeof distanceLabels], type: 'distance' });
    }
    if (searchLocation.trim()) {
      filters.push({ id: 'location', label: `Near ${searchLocation}`, type: 'location' });
    }
    setAppliedFilters(filters);
  };

  // Remove filter
  const removeFilter = (filterId: string, type: string) => {
    switch (type) {
      case 'category':
        setSelectedCategory('all');
        break;
      case 'timeRange':
        setSelectedTimeRange('all');
        break;
      case 'timeOfDay':
        setSelectedTimeOfDay('all');
        break;
      case 'distance':
        setSelectedDistance('all');
        break;
      case 'location':
        setSearchLocation('');
        break;
    }
  };

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
        if (searchLocation.trim() && searchLocation !== 'Current Location') {
          const locationLower = searchLocation.toLowerCase();
          const cityMatch = providerDetails?.business_city?.toLowerCase().includes(locationLower);
          const postcodeMatch = providerDetails?.business_postcode?.toLowerCase().includes(locationLower);
          const addressMatch = providerDetails?.business_address?.toLowerCase().includes(locationLower);
          
          if (!cityMatch && !postcodeMatch && !addressMatch) {
            return null;
          }
        }

        // Apply service category filter
        if (selectedCategory !== 'all' && slot.custom_service_name) {
          const serviceLower = slot.custom_service_name.toLowerCase();
          const categoryLower = selectedCategory.toLowerCase();
          if (!serviceLower.includes(categoryLower)) {
            return null;
          }
        }

        // Apply time of day filter
        if (selectedTimeOfDay !== 'all') {
          const startHour = parseInt(slot.start_time.split(':')[0]);
          const isValidTimeSlot = (
            (selectedTimeOfDay === 'morning' && startHour >= 6 && startHour < 12) ||
            (selectedTimeOfDay === 'afternoon' && startHour >= 12 && startHour < 18) ||
            (selectedTimeOfDay === 'evening' && startHour >= 18 && startHour < 22)
          );
          
          if (!isValidTimeSlot) {
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
      updateAppliedFilters();
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
  }, [searchLocation, selectedCategory, selectedTimeRange, selectedTimeOfDay, selectedDistance, sortBy]);

  useEffect(() => {
    updateAppliedFilters();
  }, [selectedCategory, selectedTimeRange, selectedTimeOfDay, selectedDistance, searchLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-primary/20 text-background">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJtLTEwIDMwaDYwbS0xMC0xNWg2MG0tMTAtMTVoNjBtLTEwLTE1aDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-8 animate-fade-in">
            {/* Main Headline */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-background/90 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-background/10">
                <Clock className="h-4 w-4" />
                Last-minute slots available now
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-background leading-tight">
                Book Beauty Slots
                <span className="block text-primary/90">In Minutes</span>
              </h1>
              <p className="text-xl text-background/80 max-w-3xl mx-auto font-medium leading-relaxed">
                Skip the wait lists. Find and book available beauty appointments from top-rated professionals in your area – today, tomorrow, or this week.
              </p>
            </div>

            {/* Value Proposition */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-background/70">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-sm font-medium">Live availability updated daily</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Book same day appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">Local beauty professionals</span>
              </div>
            </div>

            {/* CTA Section */}
            <div className="pt-4">
              <Button 
                onClick={() => {
                  document.getElementById('search-section')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-foreground font-bold px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-scale-in"
              >
                Find Slots Near Me
                <Search className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-background/60 text-sm mt-3 font-medium">
                Transparent pricing • Instant confirmation • Save with discounted slots
              </p>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-background" fill="currentColor" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Search and Filters */}
      <div id="search-section" className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm animate-scale-in">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              {/* Main Search Row */}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAutoDetectLocation}
                      disabled={autoDetectingLocation}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
                    >
                      {autoDetectingLocation ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                    </Button>
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
                      More Filters
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
                            <SelectItem value="facial">Facial</SelectItem>
                            <SelectItem value="waxing">Waxing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-bold mb-3 block text-foreground">Time of Day</label>
                        <Select value={selectedTimeOfDay} onValueChange={setSelectedTimeOfDay}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="morning">Morning (6AM-12PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12PM-6PM)</SelectItem>
                            <SelectItem value="evening">Evening (6PM-10PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-bold mb-3 block text-foreground">Distance</label>
                        <Select value={selectedDistance} onValueChange={setSelectedDistance}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any distance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any distance</SelectItem>
                            <SelectItem value="1">Within 1 mile</SelectItem>
                            <SelectItem value="5">Within 5 miles</SelectItem>
                            <SelectItem value="10">Within 10 miles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Applied Filters */}
              {appliedFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                  <span className="text-sm font-medium text-foreground/70">Active filters:</span>
                  {appliedFilters.map((filter) => (
                    <Badge 
                      key={filter.id}
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
                      onClick={() => removeFilter(filter.id, filter.type)}
                    >
                      {filter.label}
                      <button className="ml-2 hover:text-primary/70">×</button>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedTimeRange('all');
                      setSelectedTimeOfDay('all');
                      setSelectedDistance('all');
                      setSearchLocation('');
                    }}
                    className="text-foreground/50 hover:text-foreground text-sm h-6"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-foreground font-bold">Finding available slots...</p>
            </div>
            {/* Skeleton Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-primary/10 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-primary/10 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-3 bg-primary/10 rounded w-full"></div>
                      <div className="h-3 bg-primary/10 rounded w-2/3"></div>
                      <div className="h-8 bg-primary/10 rounded w-1/3 ml-auto"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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