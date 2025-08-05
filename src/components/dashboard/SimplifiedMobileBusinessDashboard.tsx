import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Clock, 
  PoundSterling, 
  Users,
  BookOpen,
  User,
  MessageCircle,
  CheckCircle,
  RotateCcw,
  Home,
  TrendingUp,
  Bell,
  Star,
  Share2,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuickSlotCreator from './QuickSlotCreator';
import RetentionNotifications from './RetentionNotifications';

interface WeeklyStats {
  bookings: number;
  revenue: number;
  popularService: string;
}

interface TodaySlot {
  id: string;
  service_name: string;
  start_time: string;
  price: number;
  is_booked: boolean;
}

interface UpcomingBooking {
  id: string;
  customer_name: string;
  service_name: string;
  booking_date: string;
  start_time: string;
  status: string;
}

const SimplifiedMobileBusinessDashboard = () => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    bookings: 0,
    revenue: 0,
    popularService: 'N/A'
  });
  const [todaySlots, setTodaySlots] = useState<TodaySlot[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotCreator, setShowSlotCreator] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.user_id) {
      fetchDashboardData();
      checkForRetentionTriggers();
    }
  }, [profile?.user_id]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Today's slots
      const { data: slots } = await supabase
        .from('availability_slots')
        .select(`
          id,
          start_time,
          price,
          is_booked,
          custom_service_name,
          provider_service:provider_services(service_name)
        `)
        .eq('provider_id', profile?.user_id)
        .eq('date', today)
        .order('start_time');

      setTodaySlots(slots?.map(slot => ({
        id: slot.id,
        service_name: slot.provider_service?.service_name || slot.custom_service_name || 'Service',
        start_time: slot.start_time,
        price: slot.price || 0,
        is_booked: slot.is_booked
      })) || []);

      // Weekly bookings and revenue
      const { data: weeklyBookings } = await supabase
        .from('bookings')
        .select(`
          price,
          services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .gte('booking_date', weekAgo)
        .eq('status', 'confirmed');

      const totalRevenue = weeklyBookings?.reduce((sum, booking) => sum + (booking.price || 0), 0) || 0;
      const serviceCounts: Record<string, number> = {};
      
      weeklyBookings?.forEach(booking => {
        const serviceName = booking.services?.name || 'Unknown';
        serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
      });

      const popularService = Object.keys(serviceCounts).length > 0 
        ? Object.keys(serviceCounts).reduce((a, b) => serviceCounts[a] > serviceCounts[b] ? a : b)
        : 'N/A';

      setWeeklyStats({
        bookings: weeklyBookings?.length || 0,
        revenue: totalRevenue,
        popularService
      });

      // Upcoming bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          status,
          profiles!bookings_customer_id_fkey(name),
          services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .gte('booking_date', today)
        .order('booking_date')
        .order('start_time')
        .limit(5);

      setUpcomingBookings(bookings?.map(booking => ({
        id: booking.id,
        customer_name: booking.profiles?.name || 'Customer',
        service_name: booking.services?.name || 'Service',
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        status: booking.status
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForRetentionTriggers = () => {
    // Simple retention check - show notifications if no slots posted today
    const hasPostedToday = todaySlots.length > 0;
    if (!hasPostedToday) {
      setShowNotifications(true);
    }
  };

  const markBookingComplete = async (bookingId: string) => {
    try {
      await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);
      
      toast({
        title: "Booking marked as complete",
        description: "Great work! Want to ask for a rebook?"
      });
      
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error updating booking",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-business-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20">
      {/* Header with greeting */}
      <div className="text-center py-2">
        <h1 className="text-lg font-bold text-foreground">
          Hello {profile?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Ready to fill some slots?
        </p>
      </div>

      {/* Retention Notifications */}
      {showNotifications && (
        <RetentionNotifications 
          onDismiss={() => setShowNotifications(false)}
          onCreateSlot={() => setShowSlotCreator(true)}
        />
      )}

      {/* At-a-glance stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center bg-gradient-to-br from-business-primary/20 to-business-primary/10">
          <div className="text-lg font-bold text-business-primary">
            {todaySlots.length}
          </div>
          <div className="text-xs text-muted-foreground">Today's Slots</div>
        </Card>
        <Card className="p-3 text-center bg-gradient-to-br from-accent/20 to-accent/10">
          <div className="text-lg font-bold text-accent">
            {upcomingBookings.length}
          </div>
          <div className="text-xs text-muted-foreground">Upcoming</div>
        </Card>
        <Card className="p-3 text-center bg-gradient-to-br from-business-accent/20 to-business-accent/10">
          <div className="text-lg font-bold text-business-accent">
            £{weeklyStats.revenue}
          </div>
          <div className="text-xs text-muted-foreground">This Week</div>
        </Card>
      </div>

      {/* Quick Add Slot - Floating CTA */}
      <div className="relative">
        <Button
          onClick={() => setShowSlotCreator(true)}
          className="w-full h-14 text-base font-medium btn-business rounded-xl shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Slot
        </Button>
      </div>

      {/* Quick Slot Creator Modal */}
      {showSlotCreator && (
        <QuickSlotCreator
          onClose={() => setShowSlotCreator(false)}
          onSuccess={() => {
            setShowSlotCreator(false);
            fetchDashboardData();
            toast({
              title: "Slot created! 🎉",
              description: "Want to share it on social media?"
            });
          }}
        />
      )}

      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent p-2">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-business-primary/20 data-[state=active]:text-business-primary"
            >
              <Home className="h-4 w-4" />
              <span className="text-xs">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="bookings" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-business-primary/20 data-[state=active]:text-business-primary"
            >
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex flex-col gap-1 py-3 data-[state=active]:bg-business-primary/20 data-[state=active]:text-business-primary"
            >
              <User className="h-4 w-4" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab Content */}
          <TabsContent value="dashboard" className="px-4 pb-4 space-y-4">
            {/* Simple Analytics */}
            <Card className="p-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-business-primary" />
                This Week
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bookings</span>
                  <span className="font-medium">{weeklyStats.bookings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">£{weeklyStats.revenue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Popular Service</span>
                  <span className="font-medium truncate max-w-[120px]">{weeklyStats.popularService}</span>
                </div>
              </div>
            </Card>

            {/* Today's Slots */}
            <Card className="p-4">
              <h3 className="font-medium text-sm mb-3">Today's Slots</h3>
              {todaySlots.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No slots posted today</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowSlotCreator(true)}
                  >
                    Create Your First Slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todaySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{slot.service_name}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(slot.start_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">£{slot.price}</p>
                        <Badge variant={slot.is_booked ? "default" : "outline"} className="text-xs">
                          {slot.is_booked ? "Booked" : "Available"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Bookings Tab Content */}
          <TabsContent value="bookings" className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-base">Upcoming Bookings</h3>
            </div>
            
            {upcomingBookings.length === 0 ? (
              <Card className="p-6 text-center">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">No upcoming bookings</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{booking.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.service_name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{formatDate(booking.booking_date)}</span>
                          <span>{formatTime(booking.start_time)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'outline'} className="text-xs">
                          {booking.status}
                        </Badge>
                        {booking.status === 'confirmed' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => markBookingComplete(booking.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                            >
                              <MessageCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab Content */}
          <TabsContent value="profile" className="px-4 pb-4 space-y-4">
            <Card className="p-4 text-center">
              <User className="h-12 w-12 mx-auto text-business-primary mb-3" />
              <h3 className="font-medium text-base mb-2">{profile?.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">Business Profile</p>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/profile')}
                >
                  Edit Business Info
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/business/${profile?.user_id}`)}
                >
                  View Public Profile
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SimplifiedMobileBusinessDashboard;