import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Award, Users, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/ui/header';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  business_website: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  years_experience: number;
  service_area: string;
  services_offered: string[];
  rating: number;
  total_reviews: number;
  operating_hours: string;
  pricing_info: string;
  certifications: string;
  insurance_info: string;
  emergency_available: boolean;
  certification_files: string[];
}

const NewBusinessProfile = () => {
  const [details, setDetails] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSectionUpdate = (updatedData: Partial<ProviderDetails>) => {
    setDetails(prev => prev ? { ...prev, ...updatedData } : null);
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
            <p className="text-muted-foreground mb-4">Create your business profile to get started</p>
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
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20 shadow-2xl">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-primary to-accent text-white">
                  {details.business_name?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Business Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-primary/80 bg-clip-text text-transparent">
                  {details.business_name || 'Business Name'}
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                  {details.business_description || 'Business description not provided'}
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center space-x-2 bg-card/80 rounded-xl px-4 py-2 border">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{details.rating || 0}</span>
                  <span className="text-sm text-muted-foreground">Rating</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-card/80 rounded-xl px-4 py-2 border">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="font-medium">{details.years_experience || 0}y</span>
                  <span className="text-sm text-muted-foreground">Experience</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-card/80 rounded-xl px-4 py-2 border">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="font-medium">{details.services_offered?.length || 0}</span>
                  <span className="text-sm text-muted-foreground">Services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Business Information */}
          <BusinessInfoSection
            data={{
              business_name: details.business_name,
              business_description: details.business_description,
              years_experience: details.years_experience,
              service_area: details.service_area
            }}
            userId={user?.id || ''}
            onUpdate={handleSectionUpdate}
          />

          {/* Contact Information */}
          <ContactInfoSection
            data={{
              business_email: details.business_email,
              business_phone: details.business_phone,
              business_website: details.business_website
            }}
            userId={user?.id || ''}
            onUpdate={handleSectionUpdate}
          />

          {/* Social Media Links */}
          <SocialMediaSection
            data={{
              facebook_url: details.facebook_url,
              instagram_url: details.instagram_url,
              tiktok_url: details.tiktok_url
            }}
            userId={user?.id || ''}
            onUpdate={handleSectionUpdate}
          />

          {/* Services Offered */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl p-6 border shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Services Offered</h3>
              </div>
              
              {details.services_offered && details.services_offered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {details.services_offered.map((service, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {service}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No services listed</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewBusinessProfile;