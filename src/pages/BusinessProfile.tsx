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
  DollarSign,
  FileText,
  Shield,
  Award,
  Users,
  TrendingUp,
  Camera,
  ExternalLink,
  Upload,
  Download,
  Trash2
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
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const handleSave = async () => {
    if (!editingField || !details) return;

    setUpdating(true);
    try {
      const updates: any = { [editingField]: editValue };
      
      // Handle special cases for parsed JSON fields
      if (editingField === 'pricing_info' || editingField === 'operating_hours') {
        // For now, just save as string - you might want to add JSON validation
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
  };

  const formatOperatingHours = (hoursString: string) => {
    try {
      const hours = JSON.parse(hoursString);
      return hours;
    } catch {
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
            <p className="text-muted-foreground mb-4">Complete your profile setup to view your business details</p>
            <Button onClick={() => navigate('/onboarding')}>
              Complete Profile Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {details.business_name?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {details.business_name || 'Business Profile'}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
                  {details.business_description || 'Manage your business information and showcase your professional services'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-lg">{details.rating || 0}</span>
                  <span className="text-muted-foreground">({details.total_reviews || 0} reviews)</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{details.years_experience || 0} years</span>
                  <span className="text-muted-foreground">experience</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-white/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-accent" />
                  <span className="font-semibold">{details.services_offered?.length || 0}</span>
                  <span className="text-muted-foreground">services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Business Information Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Business Information</h2>
              <p className="text-muted-foreground">Core details about your business</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Name Card */}
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
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
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
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
          </div>

          {/* Business Description - Full Width */}
          <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
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

          {/* Experience */}
          <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Years of Experience</Label>
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
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl font-bold text-primary">{details.years_experience || 0}</span>
                    <span className="text-lg text-muted-foreground">years of professional experience</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Professional experience level
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Services & Pricing Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Services & Pricing</h2>
              <p className="text-muted-foreground">What you offer and your pricing structure</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services Offered */}
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Services Offered</Label>
                <div className="space-y-3">
                  {details.services_offered?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {details.services_offered.map((service, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="px-3 py-1 text-sm bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No services configured yet</p>
                  )}
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    {details.services_offered?.length || 0} service{details.services_offered?.length !== 1 ? 's' : ''} available
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Information */}
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pricing Information</Label>
                  {editingField !== 'pricing_info' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('pricing_info', details.pricing_info)}
                      className="h-8 w-8 p-0 hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingField === 'pricing_info' ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="min-h-[100px] font-mono text-sm"
                      placeholder='[{"service": "Service Name", "price": "50"}]'
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
                    {formatPricingInfo(details.pricing_info) ? (
                      <div className="grid gap-3">
                        {formatPricingInfo(details.pricing_info).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border">
                            <span className="font-medium text-foreground">{item.service}</span>
                            <span className="text-lg font-bold text-primary">£{item.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                        No pricing information set. Add your service prices to help customers understand your rates.
                      </p>
                    )}
                    <div className="flex items-center text-muted-foreground text-sm">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Standard pricing for your services
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        <Separator className="my-8" />

        {/* Operating Hours Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Operating Hours</h2>
              <p className="text-muted-foreground">When your business is available</p>
            </div>
          </div>

          <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Operating Schedule</Label>
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
                    <div className="grid gap-2">
                      {formatOperatingHours(details.operating_hours).map((day: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg border bg-background/50">
                          <span className="font-medium text-foreground min-w-[80px]">{day.day}</span>
                          <span className={`font-medium ${day.closed ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {day.closed ? 'Closed' : `${day.open} - ${day.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                      No operating hours set. Add your business hours to help customers know when you're available.
                    </p>
                  )}
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Weekly business operating schedule
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        <Separator className="my-8" />

        {/* Professional Details Section */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Professional Details</h2>
              <p className="text-muted-foreground">Certifications, qualifications, and uploaded documents</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certifications Text */}
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certifications & Qualifications</Label>
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
                      className="min-h-[100px]"
                      placeholder="List your professional certifications, qualifications, and achievements..."
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
                      {details.certifications || 'No certifications listed yet. Add your professional qualifications to build trust with customers.'}
                    </p>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Award className="h-4 w-4 mr-2" />
                      Professional credentials and achievements
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Certification Files Upload */}
            <Card className="p-6 border-0 shadow-md bg-card/60 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Certification Documents</Label>
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
                      className="h-8 px-3"
                    >
                      {uploadingFile ? (
                        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Upload
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {details.certification_files?.length ? (
                    details.certification_files.map((fileUrl, index) => {
                      const fileName = fileUrl.split('/').pop()?.split('?')[0] || `Document ${index + 1}`;
                      const displayName = fileName.split('.')[0];
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                              {displayName}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(fileUrl, '_blank')}
                              className="h-7 w-7 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFileDelete(fileUrl, displayName)}
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
                      No certification documents uploaded yet. Upload PDFs or images of your certifications.
                    </p>
                  )}
                  <div className="flex items-center text-muted-foreground text-xs">
                    <Shield className="h-3 w-3 mr-2" />
                    Supported formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
          <Button 
            variant="outline" 
            onClick={() => navigate('/onboarding')}
            className="w-full sm:w-auto min-w-[200px] h-12 text-base"
          >
            <Edit className="h-5 w-5 mr-2" />
            Complete Profile Update
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto min-w-[200px] h-12 text-base"
          >
            <Building className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;