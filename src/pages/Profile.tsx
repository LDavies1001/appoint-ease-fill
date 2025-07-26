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
  Plus,
  X
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
  // Verification fields
  is_fully_verified?: boolean;
  identity_verified?: boolean;
  identity_verified_at?: string;
  identity_documents?: any;
  address_verified?: boolean;
  address_verified_at?: string;
  address_verification_method?: string;
  insurance_verified?: boolean;
  insurance_verified_at?: string;
  insurance_documents?: any;
  background_check_verified?: boolean;
  background_check_verified_at?: string;
  background_check_documents?: any;
  verification_completed_at?: string;
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
    if (user && profile?.active_role === 'provider') {
      fetchProviderData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  // Handle hash navigation to portfolio section
  useEffect(() => {
    if (window.location.hash === '#portfolio') {
      // Small delay to ensure the page has rendered
      setTimeout(() => {
        const portfolioElement = document.getElementById('portfolio');
        if (portfolioElement) {
          portfolioElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [loading, providerDetails]); // Run after data is loaded

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
  if (profile.active_role === 'customer') {
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
            
            {/* Business Performance Stats */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-provider" />
                  </div>
                  <h2 className="text-2xl font-semibold">Business Performance</h2>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <span className="text-3xl font-bold text-provider">
                        {providerDetails.total_reviews > 0 ? providerDetails.rating.toFixed(1) : '0.0'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-provider mb-2">
                      {providerDetails.total_reviews || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Customer Reviews</p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-provider mb-2">
                      {providerServices.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Services Offered</p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-provider mb-2">
                      {providerDetails.years_experience || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Years Experience</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* About Section */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-provider" />
                    </div>
                    <h2 className="text-2xl font-semibold">About {providerProfile.name || 'Business'}</h2>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {providerProfile.bio ? (
                  <div className="mb-6">
                    <p className="text-muted-foreground leading-relaxed">{providerProfile.bio}</p>
                  </div>
                ) : (
                  <div className="mb-6 text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No bio added yet</p>
                    {isOwner && (
                      <p className="text-xs text-muted-foreground mt-2">Add a personal bio to help customers get to know you</p>
                    )}
                  </div>
                )}
                
                {providerDetails.service_area ? (
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-provider mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Service Area</h4>
                      <p className="text-muted-foreground">{providerDetails.service_area}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Service Area</h4>
                      <p className="text-muted-foreground">Not specified</p>
                      {isOwner && (
                        <p className="text-xs text-muted-foreground mt-1">Add your service area to help customers find you</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-provider" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Services & Pricing</h2>
                      {providerServices.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {providerServices.length} services • Total value £{totalServiceValue.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No services added yet</p>
                      )}
                    </div>
                  </div>
                  {!isOwner && providerServices.length > 0 && (
                    <Button variant="provider" onClick={handleBookNow}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {providerServices.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {providerServices.map((service) => (
                        <div key={service.id} className="group relative p-5 border border-border rounded-xl hover:shadow-lg hover:border-provider/30 transition-all duration-300">
                          <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-foreground text-lg leading-tight">
                                {service.service_name}
                              </h3>
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="text-2xl font-bold text-provider">
                                  £{service.discount_price || service.base_price}
                                </div>
                                {service.discount_price && service.base_price > service.discount_price && (
                                  <div className="text-sm text-muted-foreground line-through">
                                    £{service.base_price}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {service.description ? (
                              <p className="text-muted-foreground mb-3 text-sm leading-relaxed flex-grow">
                                {service.description}
                              </p>
                            ) : (
                              <p className="text-muted-foreground mb-3 text-sm italic flex-grow">
                                No description provided
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {service.duration_text || `${service.duration_minutes} min`}
                              </div>
                              {!isOwner && (
                                <Button variant="provider" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  Book
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {providerDetails.pricing_info && (
                      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <PoundSterling className="h-4 w-4 text-provider" />
                          Additional Pricing Information
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {providerDetails.pricing_info}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Services Added</h3>
                    <p className="text-muted-foreground mb-4">
                      {isOwner 
                        ? "Add your services and pricing to attract customers" 
                        : "This business hasn't added any services yet"
                      }
                    </p>
                    {isOwner && (
                      <Button variant="provider" onClick={() => navigate('/dashboard')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Services
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Section */}
            <Card id="portfolio" className="card-elegant overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-provider/5 to-provider/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-provider" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">Portfolio Gallery</h2>
                      {portfolioItems.filter(item => item.is_public || isOwner).length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Showcasing our best work
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">No portfolio items yet</p>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {portfolioItems.filter(item => item.is_public || isOwner).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioItems
                      .filter(item => item.is_public || isOwner)
                      .map((item) => (
                      <div key={item.id} className="relative group overflow-hidden rounded-xl">
                        <div className="aspect-square relative">
                          <img 
                            src={item.image_url} 
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-3 left-3 right-3 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            {item.description && (
                              <p className="text-xs opacity-90 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          {item.featured && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-yellow-500/90 text-yellow-900 border-0">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          {!item.is_public && isOwner && (
                            <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className="bg-red-500/90 text-white border-0">
                                Private
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Portfolio Items</h3>
                    <p className="text-muted-foreground mb-4">
                      {isOwner 
                        ? "Upload photos to showcase your work and attract customers" 
                        : "This business hasn't added any portfolio items yet"
                      }
                    </p>
                    {isOwner && (
                      <Button variant="provider" onClick={() => navigate('/dashboard')}>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Add Portfolio Items
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Information */}
            <Card className="card-elegant">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-provider" />
                  </div>
                  <h3 className="text-lg font-semibold">Contact</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerDetails.business_phone ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${providerDetails.business_phone}`} className="text-sm hover:text-provider transition-colors">
                      {providerDetails.business_phone}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">No phone number provided</span>
                  </div>
                )}
                
                {providerDetails.business_email || providerProfile.email ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${providerDetails.business_email || providerProfile.email}`} className="text-sm hover:text-provider transition-colors">
                      {providerDetails.business_email || providerProfile.email}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">No email provided</span>
                  </div>
                )}
                
                {providerDetails.business_website ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={providerDetails.business_website} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-provider transition-colors">
                      Visit Website
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">No website provided</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {providerDetails.business_address && (
              <Card className="card-elegant">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-provider" />
                    </div>
                    <h3 className="text-lg font-semibold">Location</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {providerDetails.is_address_public 
                      ? providerDetails.business_address 
                      : (() => {
                          if (!providerDetails.business_address) return 'Service area not specified';
                          const parts = providerDetails.business_address.split(', ');
                          if (parts.length >= 2) {
                            const city = parts[parts.length - 2];
                            const fullPostcode = parts[parts.length - 1];
                            const postcodeArea = fullPostcode.split(' ')[0]; // Get just M23 from M23 9NY
                            return `${city}, ${postcodeArea}`;
                          }
                          return 'Service area not specified';
                        })()
                    }
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Operating Hours */}
            {providerDetails.operating_hours && (
              <Card className="card-elegant">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-provider" />
                    </div>
                    <h3 className="text-lg font-semibold">Operating Hours</h3>
                  </div>
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-provider/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-provider" />
                  </div>
                  <h3 className="text-lg font-semibold">Credentials</h3>
                </div>
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
                
                {providerDetails.is_fully_verified && (
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                    <span className="text-sm">Verified Business</span>
                  </div>
                )}
                
                {/* Show verification progress if not fully verified */}
                {!providerDetails.is_fully_verified && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Verification Progress</h4>
                    <div className="space-y-1">
                      <div className="flex items-center text-xs">
                        {providerDetails.identity_verified ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span>Identity Documents</span>
                      </div>
                      <div className="flex items-center text-xs">
                        {providerDetails.address_verified ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span>Address Verification</span>
                      </div>
                      <div className="flex items-center text-xs">
                        {providerDetails.insurance_verified ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span>Insurance & Licensing</span>
                      </div>
                      <div className="flex items-center text-xs">
                        {providerDetails.background_check_verified ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-2" />
                        )}
                        <span>Background Check</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {providerDetails.insurance_info && (
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-provider mr-3" />
                    <span className="text-sm">Insured Professional</span>
                  </div>
                )}

                {/* Certifications */}
                {providerDetails.certifications && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Certifications
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {providerDetails.certifications.split(',').map((cert: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {cert.trim()}
                        </Badge>
                      ))}
                    </div>
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