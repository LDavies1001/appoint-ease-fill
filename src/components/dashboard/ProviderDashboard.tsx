import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';

import LibraryTab from './LibraryTab';
import ProfileTab from './ProfileTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ServicesSection } from '@/components/business/ServicesSection';
import { 
  Plus, 
  Calendar, 
  Clock, 
  PoundSterling, 
  Users,
  LogOut,
  Settings,
  BookOpen,
  Upload,
  X,
  Wrench,
  Zap,
  Image,
  ExternalLink,
  Share2,
  Edit,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BulkSlotCreator from './BulkSlotCreator';
import { SocialMediaConnector } from '@/components/business/SocialMediaConnector';

interface ProviderService {
  id: string;
  service_name: string;
  description?: string;
  base_price?: number;
  discount_price?: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  typical_duration: number;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  price: number;
  discount_price?: number;
  image_url?: string;
  notes: string;
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
  end_time: string;
  status: string;
  customer: {
    name: string;
  };
  service: {
    name: string;
  };
}

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('slots');
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [mySlots, setMySlots] = useState<AvailabilitySlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [businessData, setBusinessData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // Form state for adding slots
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showBulkCreator, setShowBulkCreator] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    provider_service_id: '',
    custom_service_name: '',
    date: '',
    start_time: '',
    duration: 60,
    price: '',
    discount_price: '',
    notes: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    if (profile?.user_id) {
      fetchMySlots();
      fetchMyBookings();
      fetchProviderServices();
      fetchBusinessData();
    }
  }, [profile?.user_id]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchMySlots = async () => {
    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .select(`
          *,
          service:services(name),
          provider_service:provider_services(service_name)
        `)
        .eq('provider_id', profile?.user_id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedSlots = data?.map(slot => ({
        ...slot,
        service: {
          name: slot.service?.name || slot.provider_service?.service_name || slot.custom_service_name || 'Unknown Service'
        }
      })) || [];

      setMySlots(formattedSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
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
          customer:profiles!bookings_customer_id_fkey(name),
          service:services(name)
        `)
        .eq('provider_id', profile?.user_id)
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedBookings = data?.map(booking => ({
        ...booking,
        customer: {
          name: booking.customer?.name || 'Unknown Customer'
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

  const fetchProviderServices = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', profile?.user_id)
        .eq('is_active', true)
        .order('service_name', { ascending: true });

      if (error) throw error;
      setProviderServices(data || []);
    } catch (error) {
      console.error('Error fetching provider services:', error);
    }
  };

  const fetchBusinessData = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select(`
          *,
          business_categories:business_categories(*)
        `)
        .eq('user_id', profile?.user_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const categoriesData = data.services_offered
          ? await supabase
              .from('business_categories')
              .select('*')
              .in('id', data.services_offered)
          : { data: [] };

        setBusinessData({
          ...data,
          business_categories: categoriesData.data || []
        });
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const handleBusinessUpdate = (updatedData: any) => {
    setBusinessData(prev => ({ ...prev, ...updatedData }));
    // Refetch services when business data changes
    fetchProviderServices();
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate service selection and required fields
    if (!slotForm.provider_service_id || !slotForm.date || !slotForm.start_time || !slotForm.price) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTime = new Date(`2000-01-01T${slotForm.start_time}`);
      const endTime = new Date(startTime.getTime() + slotForm.duration * 60000);
      
      const insertData: any = {
        provider_id: profile?.user_id,
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: endTime.toTimeString().slice(0, 5),
        duration: slotForm.duration,
        price: parseFloat(slotForm.price),
        discount_price: slotForm.discount_price ? parseFloat(slotForm.discount_price) : null,
        image_url: slotForm.image_url || null,
        notes: slotForm.notes
      };

      // Add provider service
      insertData.provider_service_id = slotForm.provider_service_id;
      
      const { error } = await supabase
        .from('availability_slots')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Slot added successfully!",
      });

      // Reset form
      setSlotForm({
        provider_service_id: '',
        custom_service_name: '',
        date: '',
        start_time: '',
        duration: 60,
        price: '',
        discount_price: '',
        notes: '',
        image_url: ''
      });
      setShowAddSlot(false);
      fetchMySlots();
    } catch (error: any) {
      toast({
        title: "Error adding slot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.user_id}-slot-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.user_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(filePath);

      setSlotForm(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Image uploaded successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;
    
    // Validate required fields
    if (!slotForm.provider_service_id || !slotForm.date || !slotForm.start_time || !slotForm.price) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const startTime = new Date(`2000-01-01T${slotForm.start_time}`);
      const endTime = new Date(startTime.getTime() + slotForm.duration * 60000);
      
      const updateData: any = {
        date: slotForm.date,
        start_time: slotForm.start_time,
        end_time: endTime.toTimeString().slice(0, 5),
        duration: slotForm.duration,
        price: parseFloat(slotForm.price),
        discount_price: slotForm.discount_price ? parseFloat(slotForm.discount_price) : null,
        image_url: slotForm.image_url || null,
        notes: slotForm.notes
      };

      // Add provider service
      updateData.provider_service_id = slotForm.provider_service_id;
      
      const { error } = await supabase
        .from('availability_slots')
        .update(updateData)
        .eq('id', editingSlot.id);

      if (error) throw error;

      toast({
        title: "Slot updated successfully!",
      });

      // Reset form
      setSlotForm({
        provider_service_id: '',
        custom_service_name: '',
        date: '',
        start_time: '',
        duration: 60,
        price: '',
        discount_price: '',
        notes: '',
        image_url: ''
      });
      setEditingSlot(null);
      fetchMySlots();
    } catch (error: any) {
      toast({
        title: "Error updating slot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Populate form when editing a slot
  useEffect(() => {
    if (editingSlot) {
      // Find the provider service ID
      const providerServiceId = editingSlot.provider_service?.service_name 
        ? providerServices.find(ps => ps.service_name === editingSlot.provider_service?.service_name)?.id || ''
        : '';
      
      setSlotForm({
        provider_service_id: providerServiceId,
        custom_service_name: editingSlot.custom_service_name || '',
        date: editingSlot.date,
        start_time: editingSlot.start_time,
        duration: editingSlot.duration,
        price: editingSlot.price?.toString() || '',
        discount_price: editingSlot.discount_price?.toString() || '',
        notes: editingSlot.notes || '',
        image_url: editingSlot.image_url || ''
      });
    }
  }, [editingSlot, providerServices]);

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: "Slot deleted successfully",
      });
      
      fetchMySlots();
    } catch (error: any) {
      toast({
        title: "Error deleting slot",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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

  const upcomingBookings = myBookings.filter(booking => 
    new Date(booking.booking_date) >= new Date()
  );

  const todaysSlots = mySlots.filter(slot => 
    slot.date === new Date().toISOString().split('T')[0]
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Light Sage Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-provider via-provider-glow to-provider-secondary"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(255,255,255,0.15),_transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-8 right-8 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-8 left-8 w-24 h-24 bg-white/10 rounded-full animate-[pulse_3s_ease-in-out_infinite]"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-[pulse_4s_ease-in-out_infinite]"></div>
        
        {/* Content */}
        <div className="relative px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-6">
                <div className="space-y-4 animate-fade-in">
                  <h1 className="text-5xl md:text-6xl font-bold leading-tight drop-shadow-lg">
                    <span className="text-white">Welcome back,</span>
                    <br />
                    <span className="text-white drop-shadow-md">
                      {profile?.name || 'Provider'}!
                    </span>
                  </h1>
                  <p className="text-xl font-medium leading-relaxed text-white drop-shadow-md">
                    Ready to fill those slots and grow your business? 
                    <br />
                    <span className="text-white font-bold text-2xl drop-shadow-lg">{"Let's make today profitable! 💰"}</span>
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4 animate-slide-up">
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white border-gray-300 text-gray-800 hover:bg-gray-50 hover:text-gray-900 backdrop-blur-sm font-bold shadow-lg"
                    onClick={() => setActiveTab('bookings')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    View My Bookings
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-800 font-semibold shadow-md"
                    onClick={() => setActiveTab('profile')}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Edit My Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-800 font-semibold shadow-md"
                    onClick={() => setActiveTab('services')}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add a Service
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-800 font-semibold shadow-md"
                    onClick={() => setActiveTab('slots')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Create New Slots
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/90 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-800 font-semibold shadow-md"
                    onClick={() => setActiveTab('library')}
                  >
                    <Image className="h-5 w-5 mr-2" />
                    Upload Media
                  </Button>
                </div>
              </div>
              
              {/* Right Content - Stats Cards */}
              <div className="grid grid-cols-2 gap-4 animate-scale-in">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30 shadow-lg">
                  <div className="text-3xl font-bold text-gray-800">{todaysSlots.length}</div>
                  <div className="text-gray-700 text-sm font-semibold">Today's Slots</div>
                  <div className="mt-2 text-gray-600 text-xs">Ready to book</div>
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30 shadow-lg">
                  <div className="text-3xl font-bold text-gray-800">{upcomingBookings.length}</div>
                  <div className="text-gray-700 text-sm font-semibold">Upcoming</div>
                  <div className="mt-2 text-gray-600 text-xs">Bookings confirmed</div>
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30 shadow-lg">
                  <div className="text-3xl font-bold text-gray-800">{mySlots.length}</div>
                  <div className="text-gray-700 text-sm font-semibold">Total Slots</div>
                  <div className="mt-2 text-gray-600 text-xs">All time created</div>
                </div>
                
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 text-center border border-white/30 shadow-lg">
                  <div className="text-3xl font-bold text-gray-800">{providerServices.length}</div>
                  <div className="text-gray-700 text-sm font-semibold">Services</div>
                  <div className="mt-2 text-gray-600 text-xs">Offered by you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Navigation Tabs */}
      <Card className="card-elegant p-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
          <Button
            variant={activeTab === 'slots' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('slots')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Slot Manager</span>
            <span className="sm:hidden">Slots</span>
          </Button>
          <Button
            variant={activeTab === 'services' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('services')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <Wrench className="h-4 w-4" />
            <span>Services</span>
          </Button>
          <Button
            variant={activeTab === 'bookings' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('bookings')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>Bookings</span>
          </Button>
          <Button
            variant={activeTab === 'library' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('library')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Media Library</span>
            <span className="sm:hidden">Media</span>
          </Button>
          <Button
            variant={activeTab === 'social' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('social')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Social Media</span>
            <span className="sm:hidden">Social</span>
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'provider-hero' : 'ghost'}
            onClick={() => setActiveTab('profile')}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-auto py-3 px-2 text-xs sm:text-sm"
          >
            <Settings className="h-4 w-4" />
            <span>Profile</span>
          </Button>
        </div>
      </Card>

      {activeTab === 'slots' && (
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                Manage Availability
              </h2>
              <p className="text-muted-foreground mt-1">
                Create and manage your available appointment slots
              </p>
            </div>
            {!showAddSlot && !showBulkCreator && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkCreator(true)}
                  className="border-provider/20 hover:border-provider"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Bulk Create
                </Button>
                <Button
                  variant="provider-hero"
                  onClick={() => setShowAddSlot(true)}
                  className="shadow-elegant"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              </div>
            )}
          </div>

          {/* Add Slot Form */}
          {showAddSlot && (
            <Card className="card-elegant p-8 border-provider/10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                    Add New Slot
                  </h3>
                  <p className="text-muted-foreground mt-1">Create a new availability slot for your services</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAddSlot(false)} className="hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddSlot} className="space-y-8">
                {/* Service Selection */}
                <div className="space-y-3">
                  <Label htmlFor="service" className="text-sm font-medium">Service *</Label>
                  <Select 
                    value={slotForm.provider_service_id} 
                    onValueChange={(value) => {
                      setSlotForm(prev => ({ ...prev, provider_service_id: value, custom_service_name: "" }));
                      // Auto-fill price and duration from provider service
                      const selectedService = providerServices.find(s => s.id === value);
                      if (selectedService) {
                        setSlotForm(prev => ({ 
                          ...prev, 
                          price: selectedService.base_price?.toString() || "",
                          duration: selectedService.duration_minutes
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={providerServices.length > 0 ? "Select a service from your offerings" : "No services found - please add services first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {providerServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.service_name} {service.base_price && `(£${service.base_price})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {providerServices.length === 0 && (
                    <p className="text-sm text-muted-foreground bg-accent/10 p-3 rounded-lg border border-accent/20">
                      💡 You can type any service name here, or add predefined services in the Services tab for easier management.
                    </p>
                  )}
                </div>

                {/* Date & Time Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="date"
                        type="date"
                        value={slotForm.date}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="start_time" className="text-sm font-medium">Start Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start_time"
                        type="time"
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={slotForm.duration}
                      onChange={(e) => setSlotForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                        value={slotForm.price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, price: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="discount_price" className="text-sm font-medium">Discounted Price (optional)</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="discount_price"
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                        value={slotForm.discount_price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, discount_price: e.target.value }))}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Slot Image (optional)</Label>
                  <p className="text-sm text-muted-foreground">Add an attractive image to showcase your service</p>
                  
                  <div className="flex items-center gap-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-provider/50 hover:bg-provider/5 transition-smooth">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {uploading ? "Uploading..." : "Upload Image"}
                        </span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    
                    {slotForm.image_url && (
                      <div className="relative group">
                        <img 
                          src={slotForm.image_url} 
                          alt="Slot preview" 
                          className="w-20 h-20 object-cover rounded-xl border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSlotForm(prev => ({ ...prev, image_url: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-sm font-medium">Special Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any special instructions, requirements, or notes about this slot..."
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    variant="provider-hero"
                    className="shadow-elegant"
                    disabled={uploading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {uploading ? "Creating..." : "Create Slot"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddSlot(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit Slot Form */}
          {editingSlot && (
            <Card className="card-elegant p-8 border-provider/10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-provider bg-clip-text text-transparent">
                    Edit Slot
                  </h3>
                  <p className="text-muted-foreground mt-1">Update your availability slot details</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditingSlot(null)} className="hover:bg-destructive/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleUpdateSlot} className="space-y-8">
                {/* Service Selection */}
                <div className="space-y-3">
                  <Label htmlFor="edit-service" className="text-sm font-medium">Service *</Label>
                  <Select 
                    value={slotForm.provider_service_id} 
                    onValueChange={(value) => {
                      setSlotForm(prev => ({ ...prev, provider_service_id: value, custom_service_name: "" }));
                      // Auto-fill price and duration from provider service
                      const selectedService = providerServices.find(s => s.id === value);
                      if (selectedService) {
                        setSlotForm(prev => ({ 
                          ...prev, 
                          price: selectedService.base_price?.toString() || "",
                          duration: selectedService.duration_minutes
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={providerServices.length > 0 ? "Select a service from your offerings" : "No services found - please add services first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {providerServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.service_name} {service.base_price && `(£${service.base_price})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date & Time Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="edit-date" className="text-sm font-medium">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-date"
                        type="date"
                        value={slotForm.date}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, date: e.target.value }))}
                        min={new Date().toISOString().split("T")[0]}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-start_time" className="text-sm font-medium">Start Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="edit-start_time"
                        type="time"
                        value={slotForm.start_time}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, start_time: e.target.value }))}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-duration" className="text-sm font-medium">Duration (minutes)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      value={slotForm.duration}
                      onChange={(e) => setSlotForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      min="15"
                      step="15"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="edit-price" className="text-sm font-medium">Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm text-muted-foreground">£</span>
                      <Input
                        id="edit-price"
                        type="number"
                        step="0.01"
                        placeholder="25.00"
                        value={slotForm.price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, price: e.target.value }))}
                        className="pl-8 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="edit-discount_price" className="text-sm font-medium">Discounted Price (optional)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-sm text-muted-foreground">£</span>
                      <Input
                        id="edit-discount_price"
                        type="number"
                        step="0.01"
                        placeholder="20.00"
                        value={slotForm.discount_price}
                        onChange={(e) => setSlotForm(prev => ({ ...prev, discount_price: e.target.value }))}
                        className="pl-8 h-11"
                      />
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Slot Image (optional)</Label>
                  <p className="text-sm text-muted-foreground">Add an attractive image to showcase your service</p>
                  
                  <div className="flex items-center gap-4">
                    <label htmlFor="edit-image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-provider/50 hover:bg-provider/5 transition-smooth">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {uploading ? "Uploading..." : "Update Image"}
                        </span>
                      </div>
                      <input
                        id="edit-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    
                    {slotForm.image_url && (
                      <div className="relative group">
                        <img 
                          src={slotForm.image_url} 
                          alt="Slot preview" 
                          className="w-20 h-20 object-cover rounded-xl border border-border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSlotForm(prev => ({ ...prev, image_url: "" }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-3">
                  <Label htmlFor="edit-notes" className="text-sm font-medium">Special Notes (optional)</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Add any special instructions, requirements, or notes about this slot..."
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                  <Button
                    type="submit"
                    variant="provider-hero"
                    className="shadow-elegant"
                    disabled={uploading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {uploading ? "Updating..." : "Update Slot"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingSlot(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Bulk Slot Creator */}
          {showBulkCreator && (
            <BulkSlotCreator
              providerServices={providerServices}
              onSuccess={() => {
                setShowBulkCreator(false);
                fetchMySlots();
              }}
              onCancel={() => setShowBulkCreator(false)}
            />
          )}

            {/* Slots List */}
            <div className="grid gap-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider"></div>
                </div>
              ) : mySlots.length === 0 ? (
                <Card className="card-elegant p-8 text-center">
                  <p className="text-muted-foreground">No slots created yet.</p>
                  <Button
                    variant="provider-hero"
                    className="mt-4"
                    onClick={() => setShowAddSlot(true)}
                  >
                    Create Your First Slot
                  </Button>
                </Card>
              ) : (
                mySlots.map((slot) => (
                  <Card key={slot.id} className="card-elegant p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {slot.service.name}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(slot.date)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={slot.is_booked ? 'default' : 'secondary'}>
                              {slot.is_booked ? 'Booked' : 'Available'}
                            </Badge>
                            {slot.price && (
                              <div className="text-sm font-medium text-foreground mt-1">
                                {slot.discount_price ? (
                                  <div className="flex flex-col">
                                    <span className="line-through text-muted-foreground">£{slot.price}</span>
                                    <span className="text-destructive">£{slot.discount_price}</span>
                                  </div>
                                ) : (
                                  <span>£{slot.price}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {slot.notes && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {slot.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {!slot.is_booked && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSlot(slot)}
                          className="text-provider hover:text-provider"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <ServicesSection
            data={{
              services_offered: businessData.services_offered || [],
              business_categories: businessData.business_categories || [],
              pricing_info: businessData.pricing_info || ''
            }}
            userId={profile?.user_id || ''}
            onUpdate={handleBusinessUpdate}
          />
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">My Bookings</h2>
            
            {myBookings.length === 0 ? (
              <Card className="card-elegant p-8 text-center">
                <p className="text-muted-foreground">No bookings yet.</p>
              </Card>
            ) : (
              myBookings.map((booking) => (
                <Card key={booking.id} className="card-elegant p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Customer: {booking.customer.name}
                          </p>
                        </div>
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(booking.booking_date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

      {activeTab === 'library' && <LibraryTab />}

      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">
              Social Media Connections
            </h2>
            <p className="text-muted-foreground">
              Connect your social media accounts to showcase your work and attract more customers
            </p>
          </div>
          <SocialMediaConnector />
        </div>
      )}

      {activeTab === 'profile' && <ProfileTab />}
    </div>
  );
};

export default ProviderDashboard;