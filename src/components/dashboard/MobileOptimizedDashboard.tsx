import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Settings, 
  Image, 
  BarChart3, 
  Plus,
  Clock,
  PoundSterling,
  Zap
} from 'lucide-react';
import EnhancedLibraryTab from './EnhancedLibraryTab';
import ProfileTab from './ProfileTab';
import AnalyticsTab from './AnalyticsTab';

interface MobileOptimizedDashboardProps {
  mySlots: any[];
  myBookings: any[];
  businessData: any;
  onBusinessUpdate: (data: any) => void;
  onShowAddSlot: () => void;
  onShowBulkCreator: () => void;
  todaysSlots: any[];
  upcomingBookings: any[];
}

const MobileOptimizedDashboard: React.FC<MobileOptimizedDashboardProps> = ({
  mySlots,
  myBookings,
  businessData,
  onBusinessUpdate,
  onShowAddSlot,
  onShowBulkCreator,
  todaysSlots,
  upcomingBookings
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile-First Tab Navigation - Sticky */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <TabsList className="w-full h-auto p-2 bg-transparent justify-start">
            <div className="flex flex-wrap gap-2 w-full px-2">
              <TabsTrigger 
                value="overview" 
                className="flex-shrink-0 h-12 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="slots" 
                className="flex-shrink-0 h-12 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Slots
              </TabsTrigger>
              <TabsTrigger 
                value="bookings" 
                className="flex-shrink-0 h-12 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger 
                value="profile" 
                className="flex-shrink-0 h-12 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger 
                value="media" 
                className="flex-shrink-0 h-12 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Image className="h-4 w-4 mr-2" />
                Media
              </TabsTrigger>
            </div>
          </TabsList>
        </div>

        {/* Tab Content with Touch-Friendly Spacing */}
        <div className="p-4 space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Quick Stats - Mobile Grid */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Today's Slots</p>
                    <p className="text-2xl font-bold">{todaysSlots.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-provider/5 to-provider/10 border-provider/20">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-provider/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-provider" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Slots</p>
                    <p className="text-2xl font-bold">{mySlots.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                    <p className="text-2xl font-bold">{upcomingBookings.length}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <PoundSterling className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-lg font-bold">£{mySlots.reduce((sum: number, slot: any) => sum + (slot.price || 0), 0)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button 
                onClick={onShowAddSlot}
                className="w-full h-14 text-base"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-3" />
                Add Single Slot
              </Button>
              <Button 
                onClick={onShowBulkCreator}
                variant="outline"
                className="w-full h-14 text-base border-provider text-provider hover:bg-provider/10"
                size="lg"
              >
                <Zap className="h-5 w-5 mr-3" />
                Bulk Create Slots
              </Button>
            </div>

            {/* Recent Activity */}
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recent Activity</h3>
              </div>
              <div className="divide-y">
                {todaysSlots.slice(0, 3).map((slot: any) => (
                  <div key={slot.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant={slot.is_booked ? "destructive" : "default"} className="text-xs">
                        {slot.is_booked ? 'Booked' : 'Available'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(slot.start_time)}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{slot.service?.name}</p>
                    <p className="text-xs text-muted-foreground">£{slot.price} • {slot.duration} mins</p>
                  </div>
                ))}
                {todaysSlots.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No slots for today</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Slots Tab */}
          <TabsContent value="slots" className="mt-0 space-y-6">
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold">My Slots</h3>
              </div>
              <div className="divide-y">
                {mySlots.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No slots created yet</p>
                    <Button onClick={onShowAddSlot} className="mt-4">
                      Create Your First Slot
                    </Button>
                  </div>
                ) : (
                  mySlots.map((slot: any) => (
                    <div key={slot.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={slot.is_booked ? "destructive" : "default"}>
                          {slot.is_booked ? 'Booked' : 'Available'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(slot.date)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{slot.service?.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>{formatTime(slot.start_time)}</span>
                          <span>{slot.duration} mins</span>
                          <span className="font-medium text-foreground">£{slot.price}</span>
                        </div>
                      </div>
                      {slot.notes && (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-0">
            <Card>
              <div className="p-4 border-b">
                <h3 className="font-semibold">Upcoming Bookings</h3>
              </div>
              <div className="divide-y">
                {upcomingBookings.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming bookings</p>
                  </div>
                ) : (
                  upcomingBookings.map((booking: any) => (
                    <div key={booking.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{booking.status}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.booking_date)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{booking.customer.name}</h4>
                        <p className="text-sm text-muted-foreground">{booking.service.name}</p>
                        <p className="text-sm text-muted-foreground">{formatTime(booking.start_time)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-0">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Profile</h3>
              <p className="text-muted-foreground">Manage your business information and settings</p>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="mt-0">
            <EnhancedLibraryTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default MobileOptimizedDashboard;