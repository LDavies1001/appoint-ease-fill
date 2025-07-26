import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Eye, 
  Clock,
  PoundSterling,
  Star,
  BarChart3,
  Activity,
  Award
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalSlots: number;
  bookedSlots: number;
  totalBookings: number;
  totalRevenue: number;
  profileViews: number;
  topServices: Array<{ name: string; bookings: number; revenue: number }>;
  bookingsByDay: Array<{ day: string; bookings: number }>;
  slotsByTime: Array<{ time: string; slots: number }>;
  conversionRate: number;
  averageBookingValue: number;
}

const AnalyticsTab = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSlots: 0,
    bookedSlots: 0,
    totalBookings: 0,
    totalRevenue: 0,
    profileViews: 0,
    topServices: [],
    bookingsByDay: [],
    slotsByTime: [],
    conversionRate: 0,
    averageBookingValue: 0
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchAnalytics();
    }
  }, [profile?.user_id, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeRange));
      const thresholdStr = dateThreshold.toISOString().split('T')[0];

      // Fetch slots data
      const { data: slotsData, error: slotsError } = await supabase
        .from('availability_slots')
        .select(`
          *,
          provider_service:provider_services(service_name)
        `)
        .eq('provider_id', profile?.user_id)
        .gte('date', thresholdStr);

      if (slotsError) throw slotsError;

      // Fetch bookings data  
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          slot:availability_slots(
            provider_service:provider_services(service_name)
          )
        `)
        .eq('provider_id', profile?.user_id)
        .gte('booking_date', thresholdStr);

      if (bookingsError) throw bookingsError;

      // Calculate metrics
      const totalSlots = slotsData?.length || 0;
      const bookedSlots = slotsData?.filter(slot => slot.is_booked).length || 0;
      const totalBookings = bookingsData?.length || 0;
      const totalRevenue = bookingsData?.reduce((sum, booking) => sum + (booking.price || 0), 0) || 0;
      const conversionRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Top services analysis
      const serviceStats = new Map();
      bookingsData?.forEach(booking => {
        const serviceName = booking.slot?.provider_service?.service_name || 'Unknown Service';
        const current = serviceStats.get(serviceName) || { bookings: 0, revenue: 0 };
        serviceStats.set(serviceName, {
          bookings: current.bookings + 1,
          revenue: current.revenue + (booking.price || 0)
        });
      });

      const topServices = Array.from(serviceStats.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Bookings by day of week
      const dayStats = new Map();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      days.forEach(day => dayStats.set(day, 0));
      
      bookingsData?.forEach(booking => {
        const day = new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long' });
        dayStats.set(day, (dayStats.get(day) || 0) + 1);
      });

      const bookingsByDay = Array.from(dayStats.entries()).map(([day, bookings]) => ({ day, bookings }));

      // Slots by time of day
      const timeStats = new Map();
      const timeSlots = ['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-24)'];
      timeSlots.forEach(time => timeStats.set(time, 0));

      slotsData?.forEach(slot => {
        const hour = parseInt(slot.start_time.split(':')[0]);
        let timeSlot;
        if (hour >= 6 && hour < 12) timeSlot = 'Morning (6-12)';
        else if (hour >= 12 && hour < 18) timeSlot = 'Afternoon (12-18)';
        else timeSlot = 'Evening (18-24)';
        
        timeStats.set(timeSlot, (timeStats.get(timeSlot) || 0) + 1);
      });

      const slotsByTime = Array.from(timeStats.entries()).map(([time, slots]) => ({ time, slots }));

      setAnalytics({
        totalSlots,
        bookedSlots,
        totalBookings,
        totalRevenue,
        profileViews: Math.floor(Math.random() * 500) + 100, // Mock data for now
        topServices,
        bookingsByDay,
        slotsByTime,
        conversionRate,
        averageBookingValue
      });

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--provider))', 'hsl(var(--provider-glow))', 'hsl(var(--provider-secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
            Business Analytics
          </h2>
          <p className="text-muted-foreground mt-1">
            Track your performance and grow your business
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.profileViews}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-provider">+12%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.bookedSlots} of {analytics.totalSlots} slots booked
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Slots to bookings ratio
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <PoundSterling className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: £{analytics.averageBookingValue.toFixed(2)} per booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Day Chart */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Bookings by Day
            </CardTitle>
            <CardDescription>See which days are most popular</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.bookingsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="bookings" fill="hsl(var(--provider))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Slots by Time Chart */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Slots by Time of Day
            </CardTitle>
            <CardDescription>Most popular appointment times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.slotsByTime}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="slots"
                >
                  {analytics.slotsByTime.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performing Services
          </CardTitle>
          <CardDescription>Your most booked services</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No booking data available for the selected period
            </p>
          ) : (
            <div className="space-y-4">
              {analytics.topServices.map((service, index) => (
                <div key={service.name} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {service.bookings} booking{service.bookings !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">£{service.revenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">
                      £{(service.revenue / service.bookings).toFixed(2)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card className="card-elegant border-provider/20 bg-provider/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-provider">
            <Activity className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.conversionRate < 50 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
                <TrendingUp className="h-5 w-5 text-provider mt-0.5" />
                <div>
                  <h4 className="font-medium">Boost Your Conversion Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    Your conversion rate is {analytics.conversionRate.toFixed(1)}%. Consider adding more attractive images or adjusting your pricing.
                  </p>
                </div>
              </div>
            )}
            {analytics.topServices.length > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
                <Star className="h-5 w-5 text-provider mt-0.5" />
                <div>
                  <h4 className="font-medium">Focus on Your Top Service</h4>
                  <p className="text-sm text-muted-foreground">
                    "{analytics.topServices[0]?.name}" is your most popular service. Consider creating more slots for this service.
                  </p>
                </div>
              </div>
            )}
            {analytics.profileViews > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/50">
                <Users className="h-5 w-5 text-provider mt-0.5" />
                <div>
                  <h4 className="font-medium">Great Profile Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    Your profile has been viewed {analytics.profileViews} times. Keep your portfolio updated to maintain interest.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;