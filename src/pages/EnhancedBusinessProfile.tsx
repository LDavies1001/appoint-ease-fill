// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { addCompatibilityFields } from '@/utils/schema-compatibility';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

const EnhancedBusinessProfile = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
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

      // Fetch portfolio items (both public and private if owner)
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', providerId)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;

      // Fetch provider services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId)
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
        .eq('provider_id', providerId)
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
    navigate(`/provider/${providerId}/book`);
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/business/${providerId}`;
    
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

  // Derived values
  const businessName = providerDetails?.business_name || providerProfile?.name || 'Business';
  const operatingHours = providerDetails ? parseOperatingHours(providerDetails.operating_hours) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5">
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
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
            <p className="text-muted-foreground mb-4">This business profile could not be found or is not public.</p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-provider/5 overflow-x-hidden w-full">
      
      {/* Hero Banner Section */}
      <div className="relative">
        {/* Hero Banner Background */}
        <div className="relative w-full h-80 bg-gradient-to-br from-primary/90 via-primary/70 to-secondary/60 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.1),_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_transparent_40%,_rgba(255,255,255,0.05)_60%)]"></div>
          
          {/* Content Container */}
          <div className="relative h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 py-8 w-full">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                
                {/* Business Avatar/Logo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-sm">
                      {providerDetails?.business_logo_url ? (
                        <img
                          src={providerDetails.business_logo_url}
                          alt={`${businessName} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <Building className="h-16 w-16 lg:h-20 lg:w-20 opacity-60" />
                        </div>
                      )}
                    </div>
                    
                    {/* Verification Badge */}
                    {providerDetails?.profile_published && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Information */}
                <div className="flex-1 text-center lg:text-left text-white">
                  <h1 className="text-3xl lg:text-5xl font-bold mb-3 drop-shadow-lg">
                    {businessName}
                  </h1>
                  
                  {providerProfile?.name && providerProfile.name !== businessName && (
                    <p className="text-xl lg:text-2xl opacity-90 mb-4 drop-shadow">
                      by {providerProfile.name}
                    </p>
                  )}

                  {/* Key Stats */}
                  <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-6">
                    {providerDetails?.rating && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(providerDetails.rating)
                                  ? 'fill-yellow-300 text-yellow-300'
                                  : 'text-white/40'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold">{providerDetails.rating.toFixed(1)}</span>
                        <span className="text-sm opacity-90">
                          ({providerDetails.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                    
                    {providerProfile?.location && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <MapPin className="h-4 w-4" />
                        <span>{providerProfile.location}</span>
                      </div>
                    )}
                    
                    {providerDetails?.years_experience && (
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Award className="h-4 w-4" />
                        <span>{providerDetails.years_experience} years experience</span>
                      </div>
                    )}
                  </div>

                  {/* Business Description */}
                  {(providerProfile?.bio || providerDetails?.business_description) && (
                    <p className="text-lg opacity-95 mb-6 max-w-2xl leading-relaxed drop-shadow">
                      {providerDetails?.business_description || providerProfile?.bio}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 text-center space-y-4">
                  <Button 
                    size="lg" 
                    className="w-full lg:w-auto bg-white text-primary hover:bg-gray-100 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    onClick={handleBookNow}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Appointment
                  </Button>
                  
                  <div className="space-y-2">
                    {(providerDetails?.business_phone || providerProfile?.phone) && (
                      <a 
                        href={`tel:${providerDetails?.business_phone || providerProfile?.phone}`}
                        className="flex items-center justify-center space-x-2 text-white hover:text-yellow-200 transition-colors group"
                      >
                        <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Call Now</span>
                      </a>
                    )}
                    
                    {providerDetails?.business_email && (
                      <a 
                        href={`mailto:${providerDetails.business_email}`}
                        className="flex items-center justify-center space-x-2 text-white hover:text-yellow-200 transition-colors group"
                      >
                        <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Send Message</span>
                      </a>
                    )}
                  </div>
                </div>
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
            
            {/* Services Section */}
            {providerServices.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold">Services Offered</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {providerServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-muted bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{service.service_name}</h3>
                          {service.description && (
                            <p className="text-muted-foreground mt-1">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{service.duration_text || `${service.duration_minutes} min`}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {service.discount_price ? (
                            <div>
                              <span className="text-lg font-bold text-green-600">
                                £{service.discount_price}
                              </span>
                              <span className="text-sm text-muted-foreground line-through ml-2">
                                £{service.base_price}
                              </span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold">£{service.base_price}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Section */}
            {portfolioItems.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-semibold">Portfolio</h2>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolioItems.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow group"
                      >
                        <div className="aspect-square">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm opacity-90 mt-1">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Information */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                <h3 className="text-xl font-semibold">Contact Information</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {(providerDetails?.business_phone || providerProfile?.phone) && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{providerDetails?.business_phone || providerProfile?.phone}</span>
                  </div>
                )}
                
                {providerDetails?.business_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>{providerDetails.business_email}</span>
                  </div>
                )}

                {providerDetails?.business_website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <a 
                      href={providerDetails.business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}

                {providerProfile?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{providerProfile.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operating Hours */}
            {operatingHours.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5">
                  <h3 className="text-xl font-semibold">Operating Hours</h3>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    {operatingHours.map(({ day, hours }, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-medium">{day}</span>
                        <span className="text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Share Profile */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <Button
                  onClick={handleShareProfile}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBusinessProfile;