import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Clock, 
  Award,
  Shield,
  Edit2,
  Camera,
  Instagram,
  Facebook,
  Heart,
  Share2,
  MessageCircle,
  Calendar,
  PoundSterling,
  CheckCircle,
  Users,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Building,
  User,
  Image as ImageIcon,
  Map,
  FileText,
  Copy,
  Plus
} from 'lucide-react';
import Header from '@/components/ui/header';

interface ProviderProfile {
  user_id: string;
  name: string;
  bio: string;
  avatar_url: string;
  location: string;
  phone: string;
  email: string;
}

interface BusinessCategory {
  id: string;
  name: string;
  description: string;
}

interface ProviderDetails {
  business_name: string;
  business_description: string;
  business_address: string;
  business_street: string;
  business_city: string;
  business_county: string;
  business_postcode: string;
  business_country: string;
  is_address_public: boolean;
  business_phone: string;
  business_email: string;
  business_website: string;
  rating: number;
  total_reviews: number;
  years_experience: number;
  certifications: string;
  insurance_info: string;
  certification_files: string[];
  operating_hours: string;
  availability_notes: string;
  services_offered: string[];
  service_area: string;
  pricing_info: string;
  cover_image_url: string | null;
  business_logo_url: string | null;
  social_media_links: any;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  profile_published: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
  is_public: boolean;
}

interface ProviderService {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  discount_price?: number;
  duration_minutes: number;
  duration_text?: string;
  is_active: boolean;
}

interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  profile_picture_url?: string;
  is_active: boolean;
}

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Use route protection to handle auth state and redirects
  useRouteProtection();

  // Check if current user is the profile owner
  const isOwner = profile?.user_id === user?.id;

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      fetchProviderData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchProviderData = async () => {
    try {
      setLoading(true);

      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch provider details
      const { data: detailsData, error: detailsError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (detailsError) throw detailsError;

      // Fetch portfolio items (both public and private if owner)
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user?.id)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;

      // Fetch provider services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('is_active', true)
        .order('service_name');

      if (servicesError) throw servicesError;

      // Fetch business categories if services are offered
      let categoriesData: BusinessCategory[] = [];
      if (detailsData?.services_offered && detailsData.services_offered.length > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('business_categories')
          .select('*')
          .in('id', detailsData.services_offered);

        if (!categoriesError) {
          categoriesData = categories || [];
        }
      }

      // Fetch social media connections
      const { data: socialData, error: socialError } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('is_active', true);

      if (socialError) throw socialError;

      setProviderProfile(profileData);
      setProviderDetails(detailsData);
      setPortfolioItems(portfolioData || []);
      setProviderServices(servicesData || []);
      setBusinessCategories(categoriesData);
      setSocialConnections(socialData || []);
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

  const handleCustomerProfileSubmit = async (data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.full_name,
          phone: data.phone,
          location: data.location,
          bio: data.bio,
          privacy_settings: data.privacy_settings,
          gdpr_consent: data.gdpr_consent,
          terms_accepted: data.terms_accepted,
          is_profile_complete: true,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const parseOperatingHours = (hoursStr: string) => {
    if (!hoursStr) return [];
    
    try {
      return hoursStr.split('\n').map(line => {
        const [day, hours] = line.split(': ');
        return { day, hours };
      });
    } catch {
      return [];
    }
  };

  const handleBookNow = () => {
    navigate(`/provider/${user?.id}/book`);
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/business/${user?.id}`;
    
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

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Customer Profile View
  if (profile.role === 'customer') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerProfileForm
                initialData={{
                  full_name: profile.name || '',
                  email: profile.email,
                  phone: profile.phone || '',
                  location: profile.location || '',
                  bio: profile.bio || '',
                  privacy_settings: profile.privacy_settings || {
                    phone_visible: true,
                    email_visible: false,
                    location_visible: true,
                  },
                  gdpr_consent: profile.gdpr_consent || false,
                  terms_accepted: profile.terms_accepted || false,
                }}
                onSubmit={handleCustomerProfileSubmit}
                isEdit={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const operatingHours = providerDetails ? parseOperatingHours(providerDetails.operating_hours) : [];
  const totalServiceValue = providerServices.reduce((sum, service) => sum + (service.base_price || 0), 0);

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
      
      {/* Hero/Cover Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 md:h-80 lg:h-96 bg-gradient-to-r from-provider/20 via-provider/10 to-provider/20 overflow-hidden">
          {providerDetails.cover_image_url ? (
            <img 
              src={providerDetails.cover_image_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-provider via-provider-dark to-provider flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg opacity-75">Professional Beauty Services</p>
              </div>
            </div>
          )}
          {isOwner && (
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white" onClick={() => navigate('/dashboard')}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        {/* Business Header */}
        <div className="relative bg-gradient-to-r from-card via-card/95 to-card border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Business Logo/Avatar */}
              <div className="relative flex-shrink-0 -mt-16 lg:-mt-20">
                <div className="relative">
                  <Avatar className="h-24 w-24 lg:h-32 lg:w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={providerDetails.business_logo_url || providerProfile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-provider to-provider-dark text-white">
                      {providerDetails.business_name?.charAt(0) || providerProfile.name?.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  {providerDetails.profile_published && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0 pt-4 lg:pt-8">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-2">
                      {providerDetails.business_name}
                    </h1>
                    
                    {providerProfile.name && providerProfile.name !== providerDetails.business_name && (
                      <p className="text-lg text-muted-foreground mb-2">
                        with {providerProfile.name}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleShareProfile}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Save
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
                
                {providerDetails.business_description && (
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-3xl">
                    {providerDetails.business_description}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-6 mb-4">
                  {providerDetails.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-lg">{providerDetails.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-muted-foreground">
                        ({providerDetails.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                  
                  {providerDetails.years_experience > 0 && (
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-provider" />
                      <span className="font-medium">{providerDetails.years_experience} years experience</span>
                    </div>
                  )}

                  {providerServices.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-provider" />
                      <span className="font-medium">{providerServices.length} services</span>
                    </div>
                  )}

                  {portfolioItems.filter(item => item.is_public || isOwner).length > 0 && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-provider" />
                      <span className="font-medium">
                        {portfolioItems.filter(item => item.is_public || isOwner).length} portfolio items
                      </span>
                    </div>
                  )}
                </div>

                {/* Business Categories */}
                {businessCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {businessCategories.map((category) => (
                      <Badge key={category.id} variant="secondary" className="bg-provider/10 text-provider border-provider/20">
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Our Business */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-2xl font-semibold">About Our Business</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Business Description */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Our Story</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {providerDetails.business_description || "Welcome to our business! We're dedicated to providing exceptional service."}
                    </p>
                  </div>

                  {/* Connect With Us */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      Connect With Us
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const socialMedia = providerDetails.social_media_links || {};
                        const platforms = [
                          { name: 'Instagram', key: 'instagram', icon: Instagram, color: 'text-pink-600' },
                          { name: 'Facebook', key: 'facebook', icon: Facebook, color: 'text-blue-600' }
                        ];
                        
                        return platforms.map(platform => {
                          const IconComponent = platform.icon;
                          const hasAccount = socialMedia[platform.key];
                          
                          return hasAccount ? (
                            <a
                              key={platform.key}
                              href={`https://${platform.key}.com/${socialMedia[platform.key].replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all group"
                            >
                              <IconComponent className={`h-5 w-5 mr-3 ${platform.color}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{platform.name}</p>
                                <p className="text-xs text-muted-foreground truncate">@{socialMedia[platform.key].replace('@', '')}</p>
                              </div>
                            </a>
                          ) : (
                            <div key={platform.key} className="flex items-center p-3 bg-muted/30 rounded-lg">
                              <IconComponent className="h-5 w-5 mr-3 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-muted-foreground">{platform.name}</p>
                                <p className="text-xs text-muted-foreground">Not connected</p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Certifications & Specialties
                    </h4>
                    
                    {providerDetails.certifications ? (
                      <div className="flex flex-wrap gap-2">
                        {providerDetails.certifications.split(',').map((cert: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {cert.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">
                        Professional certifications coming soon
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Section */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                    <Camera className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-2xl font-semibold">Portfolio</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioItems.slice(0, 6).map((item) => (
                      <div key={item.id} className="relative group overflow-hidden rounded-lg">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                          <p className="text-white text-sm font-medium">{item.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Portfolio coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                    <PoundSterling className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-2xl font-semibold">Services & Pricing</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {providerServices.length > 0 ? (
                  <div className="space-y-4">
                    {providerServices.map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{service.service_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.description || 'Professional service tailored to your needs'}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.duration_minutes ? `${service.duration_minutes} min` : 'Contact for duration'}
                          </div>
                        </div>
                        <Badge className="bg-provider/10 text-provider">
                          £{service.base_price}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PoundSterling className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Services coming soon</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Details */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="h-5 w-5 mr-2 text-provider" />
                  Contact Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerDetails.business_phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-muted-foreground mr-3" />
                    <span className="text-sm">{providerDetails.business_phone}</span>
                  </div>
                )}
                
                {providerDetails.business_email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-muted-foreground mr-3" />
                    <span className="text-sm">{providerDetails.business_email}</span>
                  </div>
                )}
                
                {providerDetails.business_website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-muted-foreground mr-3" />
                    <a href={providerDetails.business_website} target="_blank" rel="noopener noreferrer" className="text-sm text-provider hover:underline">
                      Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {providerDetails.business_address && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-provider" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{providerDetails.business_address}</p>
                </CardContent>
              </Card>
            )}

            {/* Operating Hours */}
            {providerDetails.operating_hours && (
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2 text-provider" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {operatingHours.map((day, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="font-medium">{day.day}</span>
                        <span className="text-muted-foreground">{day.hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Credentials */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="h-5 w-5 mr-2 text-provider" />
                  Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerDetails.years_experience > 0 && (
                  <div className="text-center py-4 border-b">
                    <div className="text-2xl font-bold text-provider mb-1">
                      {providerDetails.years_experience}+ Years
                    </div>
                    <p className="text-sm text-muted-foreground">Professional Experience</p>
                  </div>
                )}
                
                {providerDetails.profile_published && (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Verified Business</span>
                  </div>
                )}
                
                {providerDetails.insurance_info && (
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-provider mr-3" />
                    <span className="text-sm">Insured Professional</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;