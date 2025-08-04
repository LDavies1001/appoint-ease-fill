import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Calendar, 
  Clock, 
  PoundSterling, 
  Users,
  BookOpen,
  Image,
  BarChart3,
  User,
  Grid3X3,
  ChevronRight,
  MapPin,
  Star,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  price: number;
  discount_price?: number;
  is_booked: boolean;
  provider_service?: {
    service_name: string;
  };
  service?: {
    name: string;
  };
  custom_service_name?: string;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  customer: {
    name: string;
  };
  service: {
    name: string;
  };
}

const MobileProviderDashboard = () => {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<AvailabilitySlot[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.user_id) {
      fetchDashboardData();
    }
  }, [profile?.user_id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const today = new Date().toISOString().split('T')[0];
      
      // Today's slots
      const { data: todaySlots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', profile?.user_id)
        .eq('date', today);

      // Upcoming bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          customer:profiles!bookings_customer_id_fkey(name),
          service:services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .limit(5);

      // Total slots
      const { count: totalSlots } = await supabase
        .from('availability_slots')
        .select('*', { count: 'exact' })
        .eq('provider_id', profile?.user_id);

      // Services count
      const { count: servicesCount } = await supabase
        .from('provider_services')
        .select('*', { count: 'exact' })
        .eq('provider_id', profile?.user_id)
        .eq('is_active', true);

      setStats([
        {
          label: "Today's Slots",
          value: todaySlots?.length || 0,
          icon: <Calendar className="h-4 w-4" />,
          color: "text-blue-600"
        },
        {
          label: "Upcoming Bookings",
          value: bookings?.length || 0,
          icon: <BookOpen className="h-4 w-4" />,
          color: "text-green-600"
        },
        {
          label: "Total Slots",
          value: totalSlots || 0,
          icon: <Clock className="h-4 w-4" />,
          color: "text-purple-600"
        },
        {
          label: "Active Services",
          value: servicesCount || 0,
          icon: <Zap className="h-4 w-4" />,
          color: "text-orange-600"
        }
      ]);

      // Fetch upcoming slots
      const { data: slots } = await supabase
        .from('availability_slots')
        .select(`
          *,
          service:services(name),
          provider_service:provider_services(service_name)
        `)
        .eq('provider_id', profile?.user_id)
        .eq('is_booked', false)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      setUpcomingSlots(slots || []);
      setRecentBookings(bookings?.map(booking => ({
        ...booking,
        customer: booking.customer || { name: 'Unknown Customer' },
        service: booking.service || { name: 'Unknown Service' }
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error loading dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Welcome Section */}
      <div className="text-center py-4">
        <h1 className="text-xl font-bold text-foreground mb-1">
          Welcome back, {profile?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your business on the go
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center space-x-2">
              <div className={`${stat.color}`}>
                {stat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground truncate">
                  {stat.label}
                </p>
                <p className="font-semibold text-sm">
                  {stat.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 flex-col gap-1"
            onClick={() => navigate('/dashboard?tab=slots')}
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs">Add Slot</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-12 flex-col gap-1"
            onClick={() => navigate('/dashboard?tab=services')}
          >
            <Zap className="h-4 w-4" />
            <span className="text-xs">Services</span>
          </Button>
        </div>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="slots" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="slots" className="text-xs flex flex-col gap-1 py-2">
            <Calendar className="h-3 w-3" />
            Slots
          </TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs flex flex-col gap-1 py-2">
            <BookOpen className="h-3 w-3" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="media" className="text-xs flex flex-col gap-1 py-2">
            <Image className="h-3 w-3" />
            Media
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-xs flex flex-col gap-1 py-2">
            <User className="h-3 w-3" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Slots */}
        <TabsContent value="slots" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Upcoming Slots</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard?tab=slots')}
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          {upcomingSlots.length === 0 ? (
            <Card className="p-6 text-center">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming slots</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/dashboard?tab=slots')}
              >
                Add Slot
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingSlots.map((slot) => (
                <Card key={slot.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {slot.provider_service?.service_name || slot.service?.name || slot.custom_service_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(slot.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(slot.start_time)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        £{slot.discount_price || slot.price}
                      </p>
                      <Badge variant={slot.is_booked ? "default" : "outline"} className="text-xs">
                        {slot.is_booked ? "Booked" : "Available"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recent Bookings */}
        <TabsContent value="bookings" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Recent Bookings</h3>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard?tab=bookings')}
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          
          {recentBookings.length === 0 ? (
            <Card className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent bookings</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentBookings.map((booking) => (
                <Card key={booking.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.service.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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
                    <Badge variant="default" className="text-xs">
                      {booking.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Media Tab - Placeholder */}
        <TabsContent value="media" className="space-y-3">
          <Card className="p-6 text-center">
            <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Manage your business photos</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard?tab=library')}
            >
              Go to Media Library
            </Button>
          </Card>
        </TabsContent>

        {/* Profile Tab - Placeholder */}
        <TabsContent value="profile" className="space-y-3">
          <Card className="p-6 text-center">
            <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-3">Manage your business profile</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/profile')}
            >
              Edit Profile
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MobileProviderDashboard;