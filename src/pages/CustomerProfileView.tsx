import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  notification_preferences: any;
  privacy_settings: any;
}

interface BookingHistory {
  id: string;
  booking_date: string;
  service_name: string;
  status: string;
  rating?: number;
}

export default function CustomerProfileView() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.active_role !== 'provider') {
      navigate('/dashboard');
      return;
    }
    
    if (customerId) {
      fetchCustomerProfile();
      fetchBookingHistory();
    }
  }, [customerId, profile]);

  const fetchCustomerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', customerId)
        .eq('role', 'customer')
        .maybeSingle();

      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      toast.error('Failed to load customer profile');
    }
  };

  const fetchBookingHistory = async () => {
    try {
      // First get bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          status,
          service_id
        `)
        .eq('customer_id', customerId)
        .eq('provider_id', profile?.user_id)
        .order('booking_date', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Then get service names and reviews separately
      const formattedHistory = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          // Get service name
          const { data: serviceData } = await supabase
            .from('provider_services')
            .select('service_name')
            .eq('id', booking.service_id)
            .maybeSingle();

          // Get review rating
          const { data: reviewData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('booking_id', booking.id)
            .maybeSingle();

          return {
            id: booking.id,
            booking_date: booking.booking_date,
            service_name: serviceData?.service_name || 'Unknown Service',
            status: booking.status,
            rating: reviewData?.rating
          };
        })
      );

      setBookingHistory(formattedHistory);
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const canShowEmail = () => {
    return customer?.notification_preferences?.marketing_communications && 
           customer?.privacy_settings?.email_visible;
  };

  const canShowPhone = () => {
    return customer?.notification_preferences?.marketing_communications && 
           customer?.privacy_settings?.phone_visible;
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'C';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This customer profile is not available or doesn't exist.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Customer Profile</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Customer Info */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={customer.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {getInitials(customer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl">{customer.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Customer since {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer.bio && (
                    <div>
                      <h4 className="font-medium mb-2">Bio</h4>
                      <p className="text-sm text-muted-foreground">{customer.bio}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Contact Information</h4>
                    
                    {canShowEmail() ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.email}</span>
                        <Badge variant="secondary" className="ml-auto">Marketing OK</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>Email not available for marketing</span>
                      </div>
                    )}

                    {canShowPhone() && customer.phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.phone}</span>
                        <Badge variant="secondary" className="ml-auto">Marketing OK</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>Phone not available for marketing</span>
                      </div>
                    )}

                    {customer.privacy_settings?.location_visible && customer.location ? (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{customer.location}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Location private</span>
                      </div>
                    )}
                  </div>

                  {customer.notification_preferences?.marketing_communications && (
                    <div className="pt-4 border-t">
                      <Badge variant="default" className="w-full justify-center">
                        Available for Marketing
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking History */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking History with Your Business
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingHistory.length > 0 ? (
                    <div className="space-y-4">
                      {bookingHistory.map((booking) => (
                        <div 
                          key={booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{booking.service_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {booking.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{booking.rating}</span>
                              </div>
                            )}
                            <Badge 
                              variant={
                                booking.status === 'completed' ? 'default' :
                                booking.status === 'confirmed' ? 'secondary' :
                                booking.status === 'cancelled' ? 'destructive' : 'outline'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No Booking History</h3>
                      <p className="text-sm text-muted-foreground">
                        This customer hasn't booked any services with your business yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}