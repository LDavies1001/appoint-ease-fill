import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Shield, 
  Calendar, 
  Edit2,
  ExternalLink,
  Award,
  User,
  Building,
  Share2,
  Copy,
  Map,
  Image as ImageIcon,
  Instagram,
  Facebook
} from 'lucide-react';
import Header from '@/components/ui/header';
import { CoverPhotoManager } from '@/components/business/CoverPhotoManager';
import { BusinessInfoSection } from '@/components/business/BusinessInfoSection';
import { ContactInfoSection } from '@/components/business/ContactInfoSection';
import { OperatingHoursSection } from '@/components/business/OperatingHoursSection';
import { AddressSection } from '@/components/business/AddressSection';
import { SocialMediaSection } from '@/components/business/SocialMediaSection';
import { PersonalInfoSection } from '@/components/business/PersonalInfoSection';

interface ProviderProfile {
  user_id: string;
  name: string;
  bio: string;
  avatar_url: string;
  location: string;
  phone: string;
  email: string;
}

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  rating: number;
  total_reviews: number;
  years_experience: number;
  certifications: string;
  operating_hours: string;
  services_offered: string[];
  cover_image_url: string | null;
  service_area: string;
  pricing_info: string;
  social_media_links: any;
  certification_files: string[];
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
}

interface ProviderService {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  duration_minutes: number;
  is_active: boolean;
}

const EnhancedBusinessProfile = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is the profile owner
  const isOwner = profile?.user_id === providerId;

  useEffect(() => {
    if (providerId) {
      fetchProviderData();
    }
  }, [providerId]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', providerId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch provider details
      const { data: detailsData, error: detailsError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', providerId)
        .maybeSingle();

      if (detailsError) throw detailsError;

      // Fetch portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_public', true)
        .order('featured', { ascending: false });

      if (portfolioError) throw portfolioError;

      // Fetch provider services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('service_name');

      if (servicesError) throw servicesError;

      setProviderProfile(profileData);
      setProviderDetails(detailsData);
      setPortfolioItems(portfolioData || []);
      setProviderServices(servicesData || []);
    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load the business profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate(`/provider/${providerId}/book`);
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/portfolio/${providerId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${providerDetails?.business_name || providerProfile?.name}'s Profile`,
          text: `Check out ${providerDetails?.business_name || providerProfile?.name} on OpenSlot`,
          url: profileUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link copied!",
        description: "Profile link has been copied to clipboard"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-provider mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading business profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!providerProfile || !providerDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-4">This business profile could not be found or is not public.</p>
            <Button variant="provider" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5">
      <Header />
      
      {/* Cover Photo Section */}
      <CoverPhotoManager
        coverImageUrl={providerDetails.cover_image_url}
        providerId={providerId || ''}
        onCoverImageUpdate={(url) => setProviderDetails(prev => prev ? { ...prev, cover_image_url: url } : null)}
        isOwner={isOwner}
      />
      
      {/* Business Header */}
      <div className="relative bg-gradient-to-r from-card via-card/95 to-provider/10 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Business Logo/Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-4 border-provider/20 shadow-lg">
                <AvatarImage src={providerProfile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl lg:text-4xl font-bold bg-gradient-provider text-provider-foreground">
                  {providerDetails.business_name?.charAt(0) || providerProfile.name?.charAt(0) || 'B'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                <div className="w-2 h-2 lg:w-3 lg:h-3 bg-white rounded-full"></div>
              </div>
            </div>

            {/* Business Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {providerDetails.business_name || providerProfile.name}
              </h1>
              
              {providerDetails.business_description && (
                <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                  {providerDetails.business_description}
                </p>
              )}

              {/* Quick Info */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {providerDetails.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{providerDetails.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({providerDetails.total_reviews} reviews)
                    </span>
                  </div>
                )}
                
                {providerDetails.years_experience > 0 && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-provider" />
                    <span className="text-sm">{providerDetails.years_experience} years experience</span>
                  </div>
                )}

                {providerProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{providerProfile.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              {!isOwner && (
                <Button variant="provider" size="lg" onClick={handleBookNow} className="w-full lg:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShareProfile}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                {isOwner && (
                  <Button variant="provider-outline" size="sm" onClick={() => navigate('/dashboard')}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About Section */}
            <Card className="card-elegant">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-xl font-semibold">About</h2>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <PersonalInfoSection
                  data={{
                    name: providerProfile.name,
                    bio: providerProfile.bio,
                    avatar_url: providerProfile.avatar_url,
                    location: providerProfile.location,
                    phone: providerProfile.phone
                  }}
                  userId={providerId || ''}
                  onUpdate={() => fetchProviderData()}
                />
              </CardContent>
            </Card>

            {/* Services Section */}
            {providerServices.length > 0 && (
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-xl font-semibold">Services</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerServices.map((service) => (
                      <div key={service.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow">
                        <h3 className="font-medium text-foreground mb-2">{service.service_name}</h3>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} min
                          </span>
                          <span className="font-medium text-provider">£{service.base_price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Section */}
            {portfolioItems.length > 0 && (
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-xl font-semibold">Gallery</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="relative group overflow-hidden rounded-lg">
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <p className="text-white text-sm font-medium text-center px-2">{item.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Contact & Details */}
          <div className="space-y-6">
            
            {/* Contact Information */}
            <Card className="card-elegant">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-lg font-semibold">Contact</h2>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providerDetails.business_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${providerDetails.business_phone}`} className="text-sm hover:text-provider">
                        {providerDetails.business_phone}
                      </a>
                    </div>
                  )}
                  
                  {providerDetails.business_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${providerDetails.business_email}`} className="text-sm hover:text-provider">
                        {providerDetails.business_email}
                      </a>
                    </div>
                  )}
                  
                  {providerDetails.business_website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={providerDetails.business_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:text-provider flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            {providerDetails.business_address && (
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-lg font-semibold">Location</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm">{providerDetails.business_address}</p>
                      {providerDetails.service_area && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Service area: {providerDetails.service_area}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              </Card>
            )}

            {/* Operating Hours */}
            {providerDetails.operating_hours && (
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-lg font-semibold">Hours</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    try {
                      const hours = JSON.parse(providerDetails.operating_hours);
                      return Object.entries(hours).map(([day, time]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{day}</span>
                          <span className="text-muted-foreground">{time as string}</span>
                        </div>
                      ));
                    } catch {
                      return <p className="text-sm text-muted-foreground">{providerDetails.operating_hours}</p>;
                    }
                  })()}
                </div>
              </CardContent>
              </Card>
            )}

            {/* Social Media */}
            <Card className="card-elegant">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-lg font-semibold">Social</h2>
                </div>
                {isOwner && (
                  <Button variant="ghost" size="sm">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  {providerDetails.social_media_links?.instagram_url && (
                    <a 
                      href={providerDetails.social_media_links.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-provider"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  
                  {providerDetails.social_media_links?.facebook_url && (
                    <a 
                      href={providerDetails.social_media_links.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-provider"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            {providerDetails.certifications && (
              <Card className="card-elegant">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-lg font-semibold">Certifications</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{providerDetails.certifications}</p>
                    {providerDetails.certification_files && providerDetails.certification_files.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {providerDetails.certification_files.length} certification file(s) uploaded
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBusinessProfile;