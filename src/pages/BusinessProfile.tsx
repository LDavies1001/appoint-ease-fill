import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Clock, 
  Star, 
  Edit, 
  Save, 
  X, 
  FileText,
  Shield,
  Award,
  Users,
  TrendingUp,
  Camera,
  ExternalLink,
  Upload,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import Header from '@/components/ui/header';

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_email: string;
  business_website: string;
  services_offered: string[];
  years_experience: number;
  pricing_info: string;
  operating_hours: string;
  certifications: string;
  service_area: string;
  availability_notes: string;
  insurance_info: string;
  emergency_available: boolean;
  rating: number;
  total_reviews: number;
  certification_files: string[];
}

const BusinessProfile = () => {
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[]>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [pricingItems, setPricingItems] = useState<{service: string, price: string}[]>([]);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/auth');
      return;
    }

    if (profile.role !== 'provider') {
      navigate('/dashboard');
      return;
    }

    fetchBusinessDetails();
    fetchAvailableServices();
  }, [user, profile, navigate]);

  const fetchBusinessDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDetails(data);
      }
    } catch (error) {
      console.error('Error fetching business details:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load your business profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });
      
      if (error) throw error;
      setAvailableServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue('');
  };

  const handleEditServices = () => {
    setEditingField('services_offered');
    setEditValue([]);
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    const currentServices = Array.isArray(editValue) ? editValue : [];
    if (checked) {
      setEditValue([...currentServices, serviceId]);
    } else {
      setEditValue(currentServices.filter((id: string) => id !== serviceId));
    }
  };

  const handleEditPricing = () => {
    setEditingField('pricing_info');
    // Initialize with existing pricing or empty array
    const existingPricing = formatPricingInfo(details?.pricing_info) || [];
    setPricingItems(existingPricing);
  };

  const addPricingItem = () => {
    setPricingItems([...pricingItems, { service: '', price: '' }]);
  };

  const updatePricingItem = (index: number, field: 'service' | 'price', value: string) => {
    const updated = [...pricingItems];
    updated[index][field] = value;
    setPricingItems(updated);
  };

  const removePricingItem = (index: number) => {
    setPricingItems(pricingItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!editingField || !details) return;

    setUpdating(true);
    try {
      let updates: any = {};
      
      if (editingField === 'pricing_info') {
        // Convert pricing items to JSON string
        const validItems = pricingItems.filter(item => item.service && item.price);
        updates.pricing_info = JSON.stringify(validItems);
      } else {
        updates[editingField] = editValue;
      }

      const { error } = await supabase
        .from('provider_details')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;

      setDetails(prev => prev ? { ...prev, ...updates } : null);
      setEditingField(null);
      setEditValue('');
      setPricingItems([]);

      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Could not update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue('');
    setPricingItems([]);
  };

  const formatOperatingHours = (hoursString: string) => {
    try {
      const hours = JSON.parse(hoursString);
      console.log('BusinessProfile operating hours:', hours);
      return hours;
    } catch {
      console.log('Failed to parse BusinessProfile operating hours:', hoursString);
      return null;
    }
  };

  const formatPricingInfo = (pricingString: string) => {
    try {
      const pricing = JSON.parse(pricingString);
      return pricing;
    } catch {
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please choose a file under 10MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingFile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('certifications')
        .getPublicUrl(fileName);
        
      const newFiles = [...(details?.certification_files || []), data.publicUrl];
      
      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ certification_files: newFiles })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setDetails(prev => prev ? { ...prev, certification_files: newFiles } : null);

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const getServiceNameById = (serviceId: string) => {
    const service = availableServices.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  const handleFileDelete = async (fileUrl: string, fileName: string) => {
    try {
      const newFiles = details?.certification_files?.filter(url => url !== fileUrl) || [];
      
      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ certification_files: newFiles })
        .eq('user_id', user?.id);

      if (updateError) throw updateError;

      setDetails(prev => prev ? { ...prev, certification_files: newFiles } : null);

      toast({
        title: "File deleted",
        description: `${fileName} has been removed`
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your business profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">No Business Profile Found</h1>
            <p className="text-muted-foreground mb-4">Create your business profile to showcase your services and attract customers</p>
            <div className="space-x-4">
              <Button onClick={() => navigate('/create-business-profile')}>
                Create Business Profile
              </Button>
              <Button variant="outline" onClick={() => navigate('/onboarding')}>
                Complete Basic Setup First
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-card via-card/95 to-accent/10 border-b border-border/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(120,119,198,0.1),_transparent_50%)]"></div>
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20 shadow-2xl ring-4 ring-background/50">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary via-primary/90 to-accent text-white">
                    {details.business_name?.charAt(0) || 'B'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
                {details.business_name || 'Business Hub'}
              </h1>
              <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto font-medium">
                {details.business_description || 'Professional business management and services hub'}
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 pt-8">
              <div className="flex items-center space-x-3 bg-card/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-border/50">
                <Star className="h-6 w-6 text-yellow-500" />
                <div className="text-left">
                  <div className="font-bold text-xl">{details.rating || 0}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-card/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-border/50">
                <Award className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-bold text-xl">{details.years_experience || 0}</div>
                  <div className="text-sm text-muted-foreground">Years Exp.</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-card/80 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg border border-border/50">
                <Users className="h-6 w-6 text-accent" />
                <div className="text-left">
                  <div className="font-bold text-xl">{details.services_offered?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Services</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hub Dashboard Grid */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area - Left Columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Business Information Hub Card */}
            <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-3xl p-8 shadow-xl border border-border/50 backdrop-blur-sm">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary/90 to-accent rounded-2xl flex items-center justify-center shadow-lg">
                  <Building className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Business Hub</h2>
                  <p className="text-lg text-muted-foreground/80">Manage your core business information</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Business Name Card */}
                <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Business Name</Label>
                      {editingField !== 'business_name' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit('business_name', details.business_name)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {editingField === 'business_name' ? (
                      <div className="space-y-3">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-lg font-medium"
                          placeholder="Enter business name"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xl font-semibold text-foreground">{details.business_name || 'Not set'}</p>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Building className="h-4 w-4 mr-2" />
                          Primary business identifier
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Business Website Card */}
                <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Website</Label>
                      {editingField !== 'business_website' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit('business_website', details.business_website)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {editingField === 'business_website' ? (
                      <div className="space-y-3">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="text-lg"
                          placeholder="https://your-website.com"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {details.business_website ? (
                          <a 
                            href={details.business_website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-lg font-medium text-primary hover:text-primary/80 transition-colors flex items-center group"
                          >
                            {details.business_website}
                            <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </a>
                        ) : (
                          <p className="text-lg text-muted-foreground">Not set</p>
                        )}
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Globe className="h-4 w-4 mr-2" />
                          Online presence
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Business Description - Full Width */}
                <Card className="md:col-span-2 p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Business Description</Label>
                      {editingField !== 'business_description' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit('business_description', details.business_description)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {editingField === 'business_description' ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="min-h-[120px] text-base leading-relaxed"
                          placeholder="Describe your business, services, and what makes you unique..."
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-base leading-relaxed text-foreground">
                          {details.business_description || 'No description provided yet. Add a compelling description of your business.'}
                        </p>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Tell customers about your business
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* Services & Pricing Hub */}
            <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-3xl p-8 shadow-xl border border-border/50 backdrop-blur-sm">
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-accent via-accent/90 to-primary rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl">£</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">Services & Pricing</h2>
                  <p className="text-lg text-muted-foreground/80">What you offer and your pricing structure</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Services Offered */}
                <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services Offered</Label>
                      {editingField !== 'services_offered' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditServices()}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {editingField === 'services_offered' ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                          {availableServices.map((service) => (
                            <div key={service.id} className="flex items-center space-x-3 p-2 hover:bg-background/80 rounded-lg">
                              <input
                                type="checkbox"
                                id={service.id}
                                checked={editValue.includes(service.id)}
                                onChange={(e) => handleServiceToggle(service.id, e.target.checked)}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <label htmlFor={service.id} className="flex-1 text-sm font-medium cursor-pointer">
                                {service.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            Save Services
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {details.services_offered?.length ? (
                          <div className="space-y-2">
                            {details.services_offered.map((serviceId, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-background/80 rounded-lg border">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  <span className="font-medium text-foreground">{getServiceNameById(serviceId)}</span>
                                </div>
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  Active
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                            No services configured yet. Set up your services to show what you offer.
                          </p>
                        )}
                        <div className="flex items-center text-muted-foreground text-sm mt-3">
                          <Users className="h-4 w-4 mr-2" />
                          {details.services_offered?.length || 0} service{details.services_offered?.length !== 1 ? 's' : ''} available
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Pricing Information */}
                <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pricing Information</Label>
                      {editingField !== 'pricing_info' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditPricing()}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                     {editingField === 'pricing_info' ? (
                       <div className="space-y-4">
                         <div className="bg-muted/50 rounded-lg p-3 mb-4">
                           <p className="text-xs text-muted-foreground mb-1">Example:</p>
                           <p className="text-sm font-mono">Service: "Eyelash Extensions"</p>
                           <p className="text-sm font-mono">Price: "45" (£ symbol will be added automatically)</p>
                         </div>
                         <div className="space-y-3 max-h-64 overflow-y-auto">
                           {pricingItems.map((item, index) => (
                             <div key={index} className="flex gap-2 items-start p-3 bg-background/80 rounded-lg border">
                               <div className="flex-1 space-y-2">
                                 <Input
                                   placeholder="e.g. Eyelash Extensions"
                                   value={item.service}
                                   onChange={(e) => updatePricingItem(index, 'service', e.target.value)}
                                   className="text-sm"
                                 />
                                 <Input
                                   placeholder="e.g. 45 (without £ symbol)"
                                   value={item.price}
                                   onChange={(e) => updatePricingItem(index, 'price', e.target.value)}
                                   className="text-sm"
                                 />
                               </div>
                               <Button
                                 size="sm"
                                 variant="ghost"
                                 onClick={() => removePricingItem(index)}
                                 className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                               >
                                 <X className="h-4 w-4" />
                               </Button>
                             </div>
                           ))}
                         </div>
                         
                         <Button
                           size="sm"
                           variant="outline"
                           onClick={addPricingItem}
                           className="w-full"
                         >
                           <Plus className="h-4 w-4 mr-2" />
                           Add Service Price
                         </Button>
                         
                         <div className="flex space-x-2">
                           <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                             <Save className="h-4 w-4 mr-2" />
                             Save Pricing
                           </Button>
                           <Button size="sm" variant="outline" onClick={handleCancel}>
                             <X className="h-4 w-4" />
                           </Button>
                         </div>
                       </div>
                    ) : (
                      <div className="space-y-3">
                        {formatPricingInfo(details.pricing_info) ? (
                          <div className="space-y-2">
                            {formatPricingInfo(details.pricing_info).map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-background/80 rounded-lg border hover:bg-background/90 transition-colors">
                                <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                     <span className="font-bold text-primary">£</span>
                                   </div>
                                  <span className="font-medium text-foreground text-base">{item.service}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-xl font-bold text-primary">£{item.price}</span>
                                  <p className="text-xs text-muted-foreground">Standard rate</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                            No pricing information set. Add your service prices to help customers understand your rates.
                          </p>
                        )}
                        <div className="flex items-center text-muted-foreground text-sm mt-3">
                          <span className="font-semibold text-lg mr-2">£</span>
                          Standard pricing for your services
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Actions */}
            <Card className="p-6 border-0 shadow-xl bg-gradient-to-br from-primary/5 via-card to-accent/5 backdrop-blur-sm">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground mb-2">Quick Actions</h3>
                  <p className="text-muted-foreground text-sm">Manage your business profile</p>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={() => navigate('/create-business-profile')}
                    className="w-full h-12 text-base justify-start"
                  >
                    <Edit className="h-5 w-5 mr-3" />
                    Edit Full Profile
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/onboarding')}
                    className="w-full h-12 text-base justify-start"
                  >
                    <Building className="h-5 w-5 mr-3" />
                    Quick Setup
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="w-full h-12 text-base justify-start"
                  >
                    <Users className="h-5 w-5 mr-3" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </Card>

            {/* Experience Stats */}
            <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Experience</Label>
                  {editingField !== 'years_experience' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('years_experience', details.years_experience?.toString() || '')}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingField === 'years_experience' ? (
                  <div className="space-y-3">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="text-lg"
                      placeholder="0"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-primary">{details.years_experience || 0}</span>
                      <p className="text-muted-foreground">Years Experience</p>
                    </div>
                    <div className="flex items-center justify-center text-muted-foreground text-sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Professional level
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Operating Hours */}
            <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Operating Hours</Label>
                  {editingField !== 'operating_hours' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('operating_hours', details.operating_hours)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingField === 'operating_hours' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                      placeholder='[{"day": "Monday", "open": "09:00", "close": "17:00", "closed": false}]'
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                     {formatOperatingHours(details.operating_hours) ? (
                       <div className="space-y-2">
                         {formatOperatingHours(details.operating_hours).map((dayData: any, index: number) => {
                           // Handle different data structures
                           let dayName, isOpen, timeDisplay;
                           
                           if (typeof dayData === 'object' && dayData !== null) {
                             if (dayData.day) {
                               // Structure: {day: "Monday", open: "09:00", close: "17:00", closed: false}
                               dayName = dayData.day;
                               isOpen = !dayData.closed;
                               timeDisplay = dayData.closed ? 'Closed' : `${dayData.open}-${dayData.close}`;
                             } else {
                               // Fallback for unexpected object structure
                               dayName = `Day ${index + 1}`;
                               isOpen = false;
                               timeDisplay = 'Invalid format';
                             }
                           } else {
                             // String fallback
                             dayName = dayData || `Day ${index + 1}`;
                             isOpen = true;
                             timeDisplay = 'Not specified';
                           }

                           return (
                             <div key={index} className="flex justify-between items-center text-sm">
                               <span className="font-medium">{dayName}</span>
                               <span className={isOpen ? 'text-foreground' : 'text-muted-foreground'}>
                                 {timeDisplay}
                               </span>
                             </div>
                           );
                         })}
                       </div>
                    ) : (
                      <p className="text-muted-foreground italic text-sm text-center">
                        No hours set
                      </p>
                    )}
                    <div className="flex items-center justify-center text-muted-foreground text-xs">
                      <Clock className="h-3 w-3 mr-2" />
                      Business hours
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Certifications */}
            <Card className="p-6 border-0 shadow-md bg-background/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certifications</Label>
                  {editingField !== 'certifications' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('certifications', details.certifications)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingField === 'certifications' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[100px] text-sm"
                      placeholder="List your certifications..."
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave} disabled={updating} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-foreground">
                      {details.certifications || 'No certifications listed'}
                    </p>
                    <div className="flex items-center justify-center text-muted-foreground text-xs">
                      <Shield className="h-3 w-3 mr-2" />
                      Professional credentials
                    </div>
                    
                    {/* File Upload Section */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">Documents</Label>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploadingFile}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={uploadingFile}
                            className="h-6 px-2 text-xs"
                          >
                            {uploadingFile ? (
                              <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {details.certification_files?.length ? (
                          details.certification_files.slice(0, 2).map((fileUrl, index) => {
                            const fileName = fileUrl.split('/').pop()?.split('?')[0] || `Document ${index + 1}`;
                            const displayName = fileName.split('.')[0].substring(0, 15);
                            return (
                              <div key={index} className="flex items-center justify-between text-xs bg-muted/30 rounded p-2">
                                <span className="truncate flex-1">{displayName}</span>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                    className="h-5 w-5 p-0"
                                  >
                                    <Download className="h-2 w-2" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleFileDelete(fileUrl, displayName)}
                                    className="h-5 w-5 p-0 text-destructive"
                                  >
                                    <Trash2 className="h-2 w-2" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No documents uploaded
                          </p>
                        )}
                        {details.certification_files?.length && details.certification_files.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{details.certification_files.length - 2} more files
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;