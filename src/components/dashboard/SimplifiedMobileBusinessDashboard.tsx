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
    <div className="w-full space-y-6 pb-20 bg-gradient-to-br from-background via-background/95 to-business/5 min-h-screen">
      {/* Header with greeting - Enhanced */}
      <div className="text-center py-6 px-4 bg-gradient-to-r from-business/10 via-business-accent/10 to-business/5 rounded-xl mx-3 border border-business/20 shadow-soft">
        <div className="mb-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-business-primary to-business-accent bg-clip-text text-transparent">
            Hello {profile?.name?.split(' ')[0] || 'there'} ✨
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let's make today amazing!
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-business-accent font-medium">
          <Star className="h-3 w-3 text-business-accent" />
          <span>Your success starts here</span>
          <Star className="h-3 w-3 text-business-accent" />
        </div>
      </div>

      {/* Retention Notifications */}
      {showNotifications && (
        <RetentionNotifications 
          onDismiss={() => setShowNotifications(false)}
          onCreateSlot={() => setShowSlotCreator(true)}
        />
      )}

      {/* At-a-glance stats - Enhanced */}
      <div className="grid grid-cols-3 gap-3 px-3">
        <Card className="p-4 text-center bg-gradient-to-br from-business-primary/15 to-business-primary/5 border border-business-primary/20 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in">
          <Calendar className="h-5 w-5 mx-auto text-business-primary mb-2" />
          <div className="text-2xl font-bold text-business-primary mb-1">
            {todaySlots.length}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Today's Slots</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Clock className="h-5 w-5 mx-auto text-accent mb-2" />
          <div className="text-2xl font-bold text-accent mb-1">
            {upcomingBookings.length}
          </div>
          <div className="text-xs text-muted-foreground font-medium">Upcoming</div>
        </Card>
        <Card className="p-4 text-center bg-gradient-to-br from-business-accent/15 to-business-accent/5 border border-business-accent/20 shadow-soft hover:shadow-medium transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <PoundSterling className="h-5 w-5 mx-auto text-business-accent mb-2" />
          <div className="text-2xl font-bold text-business-accent mb-1">
            £{weeklyStats.revenue}
          </div>
          <div className="text-xs text-muted-foreground font-medium">This Week</div>
        </Card>
      </div>

      {/* Quick Add Slot - Enhanced Floating CTA */}
      <div className="px-3">
        <Button
          onClick={() => setShowSlotCreator(true)}
          className="w-full h-16 text-lg font-semibold bg-gradient-to-r from-business-primary to-business-accent hover:from-business-accent hover:to-business-primary text-white rounded-2xl shadow-elegant hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-business-primary/30"
        >
          <Plus className="h-6 w-6 mr-3" />
          Add New Slot
          <Star className="h-4 w-4 ml-3 opacity-80" />
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
            {/* Simple Analytics - Enhanced */}
            <Card className="p-5 bg-gradient-to-r from-business/5 to-business-accent/5 border border-business/20 shadow-soft">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-business-primary" />
                <span className="bg-gradient-to-r from-business-primary to-business-accent bg-clip-text text-transparent">
                  This Week's Performance
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-business-primary/10 to-business-primary/5 rounded-lg border border-business-primary/20">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-business-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Bookings</span>
                  </div>
                  <span className="text-lg font-bold text-business-primary">{weeklyStats.bookings}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-business-accent/10 to-business-accent/5 rounded-lg border border-business-accent/20">
                  <div className="flex items-center gap-3">
                    <PoundSterling className="h-5 w-5 text-business-accent" />
                    <span className="text-sm font-medium text-muted-foreground">Revenue</span>
                  </div>
                  <span className="text-lg font-bold text-business-accent">£{weeklyStats.revenue}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-accent" />
                    <span className="text-sm font-medium text-muted-foreground">Top Service</span>
                  </div>
                  <span className="text-sm font-bold text-accent truncate max-w-[120px]">{weeklyStats.popularService}</span>
                </div>
              </div>
            </Card>

            {/* Today's Slots - Enhanced */}
            <Card className="p-5 bg-gradient-to-r from-background to-business/5 border border-business/20 shadow-soft">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-business-primary" />
                <span>Today's Slots</span>
              </h3>
              {todaySlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-business-primary/20 to-business-accent/20 rounded-full flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-business-primary" />
                  </div>
                  <p className="text-sm mb-3">No slots posted today</p>
                  <Button 
                    onClick={() => setShowSlotCreator(true)}
                    className="bg-gradient-to-r from-business-primary to-business-accent hover:from-business-accent hover:to-business-primary text-white rounded-lg px-6 py-2 shadow-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Slot
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySlots.map((slot, index) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-background to-business/5 rounded-lg border border-business/10 shadow-soft hover:shadow-medium transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-business-primary to-business-accent"></div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{slot.service_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(slot.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-business-accent">£{slot.price}</p>
                        <Badge 
                          variant={slot.is_booked ? "default" : "outline"} 
                          className={slot.is_booked ? "bg-business-primary text-white" : "border-business-primary/50 text-business-primary"}
                        >
                          {slot.is_booked ? "Booked" : "Available"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Bookings Tab Content - Enhanced */}
          <TabsContent value="bookings" className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-business-primary" />
                Upcoming Bookings
              </h3>
            </div>
            
            {upcomingBookings.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-to-r from-background to-business/5 border border-business/20">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-business-primary/20 to-business-accent/20 rounded-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-business-primary" />
                </div>
                <p className="text-sm text-muted-foreground">No upcoming bookings</p>
                <p className="text-xs text-muted-foreground mt-1">Your next booking will appear here</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking, index) => (
                  <Card key={booking.id} className="p-4 bg-gradient-to-r from-background to-business/5 border border-business/20 shadow-soft hover:shadow-medium transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-business-primary to-business-accent"></div>
                          <p className="font-semibold text-sm text-foreground">{booking.customer_name}</p>
                        </div>
                        <p className="text-sm text-business-accent font-medium">{booking.service_name}</p>
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
                      <div className="flex flex-col gap-2 items-end">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'outline'} 
                          className={booking.status === 'confirmed' ? "bg-business-primary text-white border-business-primary" : "border-business-primary/50 text-business-primary"}
                        >
                          {booking.status}
                        </Badge>
                        {booking.status === 'confirmed' && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs border-business-primary/30 hover:bg-business-primary/10 hover:border-business-primary/50"
                              onClick={() => markBookingComplete(booking.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complete
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs border-business-accent/30 hover:bg-business-accent/10 hover:border-business-accent/50"
                            >
                              <MessageCircle className="h-3 w-3 mr-1" />
                              Message
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

          {/* Profile Tab Content - Enhanced */}
          <TabsContent value="profile" className="px-4 pb-4 space-y-4">
            <Card className="p-6 text-center bg-gradient-to-r from-business/5 to-business-accent/5 border border-business/20 shadow-soft">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-business-primary/20 to-business-accent/20 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-business-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1 bg-gradient-to-r from-business-primary to-business-accent bg-clip-text text-transparent">
                {profile?.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 flex items-center justify-center gap-2">
                <Star className="h-3 w-3 text-business-accent" />
                Business Profile
                <Star className="h-3 w-3 text-business-accent" />
              </p>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full h-12 border-business-primary/30 hover:bg-business-primary/10 hover:border-business-primary/50 text-business-primary font-medium"
                  onClick={() => navigate('/profile')}
                >
                  Edit Business Info
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full h-12 border-business-accent/30 hover:bg-business-accent/10 hover:border-business-accent/50 text-business-accent font-medium"
                  onClick={() => navigate(`/business/${profile?.user_id}`)}
                >
                  View Public Profile
                </Button>
                
                <Button
                  className="w-full h-12 bg-gradient-to-r from-business-primary to-business-accent hover:from-business-accent hover:to-business-primary text-white font-medium shadow-medium"
                >
                  <Share2 className="h-4 w-4 mr-2" />
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