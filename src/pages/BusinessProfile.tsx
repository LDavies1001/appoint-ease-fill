import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  FileText 
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
}

const BusinessProfile = () => {
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      return hours.map((day: any) => 
        `${day.day}: ${day.closed ? 'Closed' : `${day.open} - ${day.close}`}`
      ).join('\n');
    } catch {
      return hoursString;
    }
  };

  const formatPricingInfo = (pricingString: string) => {
    try {
      const pricing = JSON.parse(pricingString);
      return pricing.map((item: any) => 
        `${item.service}: £${item.price}`
      ).join('\n');
    } catch {
      return pricingString;
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Business Profile</h1>
          <p className="text-muted-foreground">Manage your business information and settings</p>
        </div>

        {/* Business Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Business Information
            </h2>
          </div>
          
          <div className="space-y-4">
            {/* Business Name */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Business Name</Label>
                {editingField === 'business_name' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-foreground">{details.business_name || 'Not set'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('business_name', details.business_name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Business Description */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Business Description</Label>
                {editingField === 'business_description' ? (
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 min-h-[80px]"
                    />
                    <div className="flex flex-col space-y-1">
                      <Button size="sm" onClick={handleSave} disabled={updating}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mt-1">
                    <p className="text-foreground flex-1 pr-4">{details.business_description || 'Not set'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('business_description', details.business_description)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Business Website */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Website</Label>
                {editingField === 'business_website' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                      placeholder="https://..."
                    />
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-foreground flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      {details.business_website ? (
                        <a href={details.business_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {details.business_website}
                        </a>
                      ) : (
                        'Not set'
                      )}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('business_website', details.business_website)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Years of Experience */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Years of Experience</Label>
                {editingField === 'years_experience' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-foreground">{details.years_experience || 'Not set'} years</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('years_experience', details.years_experience?.toString() || '')}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Services & Pricing */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Services & Pricing
            </h2>
          </div>

          <div className="space-y-4">
            {/* Services Offered */}
            <div>
              <Label className="text-sm font-medium">Services Offered</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {details.services_offered?.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                )) || <p className="text-muted-foreground">No services set</p>}
              </div>
            </div>

            {/* Pricing Information */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Pricing Information</Label>
                {editingField === 'pricing_info' ? (
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 min-h-[100px]"
                      placeholder="Service: £Price format or JSON"
                    />
                    <div className="flex flex-col space-y-1">
                      <Button size="sm" onClick={handleSave} disabled={updating}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mt-1">
                    <pre className="text-foreground whitespace-pre-wrap text-sm bg-muted p-2 rounded flex-1 mr-4">
                      {details.pricing_info ? formatPricingInfo(details.pricing_info) : 'Not set'}
                    </pre>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('pricing_info', details.pricing_info)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Operating Hours */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Operating Hours
            </h2>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingField === 'operating_hours' ? (
                <div className="flex items-start space-x-2 mt-1">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 min-h-[120px]"
                    placeholder="JSON format or Day: Time format"
                  />
                  <div className="flex flex-col space-y-1">
                    <Button size="sm" onClick={handleSave} disabled={updating}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between mt-1">
                  <pre className="text-foreground whitespace-pre-wrap text-sm bg-muted p-2 rounded flex-1 mr-4">
                    {details.operating_hours ? formatOperatingHours(details.operating_hours) : 'Not set'}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('operating_hours', details.operating_hours)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Additional Information
            </h2>
          </div>

          <div className="space-y-4">
            {/* Certifications */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-sm font-medium">Certifications</Label>
                {editingField === 'certifications' ? (
                  <div className="flex items-start space-x-2 mt-1">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 min-h-[80px]"
                    />
                    <div className="flex flex-col space-y-1">
                      <Button size="sm" onClick={handleSave} disabled={updating}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mt-1">
                    <p className="text-foreground flex-1 pr-4">{details.certifications || 'Not set'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit('certifications', details.certifications)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Display */}
            <div className="flex items-center space-x-4 pt-4 border-t">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-lg font-semibold">{details.rating || 0}</span>
                <span className="text-muted-foreground ml-1">/ 5</span>
              </div>
              <div className="text-muted-foreground">
                Based on {details.total_reviews || 0} review{details.total_reviews !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/onboarding')}
          >
            Complete Profile Update
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfile;