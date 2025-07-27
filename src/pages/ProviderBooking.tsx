import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Calendar as CalendarIcon, Clock, PoundSterling, MapPin, Star, Phone, User } from 'lucide-react';

import { format } from 'date-fns';

interface AvailableSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  discount_price?: number;
  custom_service_name?: string;
  notes?: string;
  service?: {
    name: string;
    category: string;
  };
  provider_service?: {
    service_name: string;
    description?: string;
    base_price?: number;
  };
}

interface ProviderProfile {
  user_id: string;
  name: string;
  bio: string;
  avatar_url: string;
  location: string;
  phone: string;
  email: string;
}

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_phone: string;
  business_email: string;
  rating: number;
  total_reviews: number;
  operating_hours: string;
}

const ProviderBooking = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
      fetchAvailableSlots();
    }
  }, [providerId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', providerId)
        .single();

      if (profileError) throw profileError;
      setProviderProfile(profileData);

      // Fetch provider details
      const { data: detailsData, error: detailsError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', providerId)
        .single();

      if (detailsError && detailsError.code !== 'PGRST116') {
        throw detailsError;
      }
      setProviderDetails(detailsData);

    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error",
        description: "Failed to load provider information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('availability_slots')
        .select(`
          *,
          service:services(name, category),
          provider_service:provider_services(service_name, description, base_price)
        `)
        .eq('provider_id', providerId)
        .eq('date', dateStr)
        .eq('is_booked', false)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAvailableSlots(data || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available slots.",
        variant: "destructive",
      });
    }
  };

  const handleBookSlot = async (slot: AvailableSlot) => {
    if (!user || !profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book an appointment.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setBookingLoading(true);
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: profile.user_id,
          provider_id: providerId,
          slot_id: slot.id,
          service_id: null, // We'll handle service reference differently
          booking_date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          price: slot.discount_price || slot.price,
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
        title: "Booking Confirmed!",
        description: "Your appointment has been booked successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error booking slot:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to book the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Provider Not Found</h1>
          <p className="text-muted-foreground mb-6">The provider you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const businessName = providerDetails?.business_name || providerProfile.name;
  const displayName = providerProfile.name || 'Provider';

  const filteredSlots = availableSlots;

  return (
    <div className="min-h-screen bg-background">
      
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to={`/portfolio/${providerId}`}>
            <Button variant="ghost" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
        </div>

        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={providerProfile.avatar_url} alt={displayName} />
                <AvatarFallback className="text-lg">
                  {displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-1">{businessName}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {providerProfile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {providerProfile.location}
                    </div>
                  )}
                  {providerDetails?.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {providerDetails.rating.toFixed(1)} ({providerDetails.total_reviews} reviews)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border w-full"
              />
            </CardContent>
          </Card>

          {/* Available Slots */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Available Times
                  {selectedDate && (
                    <span className="text-base font-normal text-muted-foreground ml-2">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Available Slots</h3>
                    <p className="text-muted-foreground">
                      {selectedDate 
                        ? `No appointments available on ${format(selectedDate, 'MMMM d, yyyy')}`
                        : 'Please select a date to see available appointments'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredSlots.map((slot) => (
                      <Card 
                        key={slot.id} 
                        className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                          selectedSlot?.id === slot.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {slot.start_time} - {slot.end_time}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {slot.duration} min
                                </Badge>
                              </div>
                              
                              <h4 className="font-semibold mb-1">
                                {slot.custom_service_name || 
                                 slot.provider_service?.service_name || 
                                 slot.service?.name || 
                                 'Service'}
                              </h4>
                              
                              {(slot.provider_service?.description || slot.notes) && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {slot.provider_service?.description || slot.notes}
                                </p>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-2">
                                <PoundSterling className="h-4 w-4" />
                                <span className="font-semibold">
                                  {slot.discount_price ? (
                                    <>
                                      <span className="line-through text-muted-foreground text-sm mr-1">
                                        £{slot.price?.toFixed(2)}
                                      </span>
                                      £{slot.discount_price.toFixed(2)}
                                    </>
                                  ) : (
                                    `£${slot.price?.toFixed(2) || '0.00'}`
                                  )}
                                </span>
                              </div>
                              
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBookSlot(slot);
                                }}
                                disabled={bookingLoading}
                                className={selectedSlot?.id === slot.id ? 'bg-primary' : ''}
                              >
                                {bookingLoading ? 'Booking...' : 'Book Now'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Info */}
        {(providerDetails?.business_phone || providerProfile.phone) && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Need to speak with us?</h3>
                  <p className="text-sm text-muted-foreground">
                    Call us directly to discuss your requirements
                  </p>
                </div>
                <a 
                  href={`tel:${providerDetails?.business_phone || providerProfile.phone}`}
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">
                    {providerDetails?.business_phone || providerProfile.phone}
                  </span>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProviderBooking;