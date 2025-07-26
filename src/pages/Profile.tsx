import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';

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
  user_id: string;
  business_name: string;
  business_description: string;
  business_email: string;
  business_phone: string;
  business_website: string;
  business_address: string;
  business_street: string;
  business_city: string;
  business_county: string;
  business_country: string;
  business_postcode: string;
  postcode_area: string;
  coverage_towns: string[];
  business_logo_url: string;
  cover_image_url: string;
  operating_hours: string;
  certifications: string;
  insurance_info: string;
  certification_files: string[];
  awards_recognitions: string;
  professional_memberships: string;
  other_qualifications: string;
  pricing_info: string;
  years_experience: number;
  services_offered: string[];
  business_category: string;
  rating: number;
  total_reviews: number;
  profile_published: boolean;
  profile_visibility: string;
  is_address_public: boolean;
  emergency_available: boolean;
  social_media_links: any;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  tags: string[];
  featured: boolean;
  is_public: boolean;
  view_count: number;
  public_slug: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer: {
    name: string;
  };
}

interface Service {
  id: string;
  service_name: string;
  description: string;
  base_price: number;
  discount_price: number;
  duration_minutes: number;
  duration_text: string;
  is_active: boolean;
}

interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  profile_picture_url: string;
  is_active: boolean;
}

const Profile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Use route protection to handle auth state and redirects
  useRouteProtection();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'provider') {
        fetchProviderData();
      } else {
        setLoading(false);
      }
    }
  }, [user, profile]);

  const fetchProviderData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch provider profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProviderProfile(profileData);

      // Fetch provider details
      const { data: detailsData } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProviderDetails(detailsData);

      // Fetch portfolio items
      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user.id)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      setPortfolioItems(portfolioData || []);

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(name)
        `)
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setReviews(reviewsData || []);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      setServices(servicesData || []);

      // Fetch social connections
      const { data: socialData } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', user.id)
        .eq('is_active', true);

      setSocialConnections(socialData || []);

    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data. Please refresh the page.",
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : i < rating
            ? 'fill-yellow-400/50 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatOperatingHours = (hoursString: string) => {
    if (!hoursString) return null;
    try {
      return JSON.parse(hoursString);
    } catch {
      return null;
    }
  };

  const getDayName = (dayKey: string | number) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const numericKey = typeof dayKey === 'string' ? parseInt(dayKey) : dayKey;
    
    if (typeof numericKey === 'number' && numericKey >= 0 && numericKey <= 6) {
      return dayNames[numericKey];
    }
    
    if (typeof dayKey === 'string') {
      return dayKey.charAt(0).toUpperCase() + dayKey.slice(1).toLowerCase();
    }
    
    return 'Unknown Day';
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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center">
                  <User className="h-6 w-6 mr-2" />
                  My Profile
                </h1>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
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

  // Loading state for providers
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  // Provider Profile View - Enhanced Business Profile
  const isOwner = true; // This is always the user's own profile
  const businessEmail = providerDetails?.business_email || providerProfile?.email;
  const operatingHours = formatOperatingHours(providerDetails?.operating_hours || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      <Header />
      
      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-80 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 relative overflow-hidden">
          {providerDetails?.cover_image_url && (
            <img
              src={providerDetails.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Profile Info Overlay */}
        <div className="relative -mt-24 container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-6 mb-8">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarImage
                  src={providerProfile?.avatar_url}
                  alt={providerProfile?.name}
                />
                <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">
                  {providerProfile?.name?.charAt(0)?.toUpperCase() || 'B'}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Business Info */}
            <div className="flex-1 lg:pb-4">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {providerDetails?.business_name || providerProfile?.name || 'Business Name'}
                    </h1>
                    <div className="flex items-center gap-4 mb-3">
                      {providerDetails?.rating && providerDetails.rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(providerDetails.rating)}</div>
                          <span className="font-semibold">{providerDetails.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">
                            ({providerDetails.total_reviews || 0} reviews)
                          </span>
                        </div>
                      )}
                      {providerDetails?.profile_published && (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    {providerProfile?.location && (
                      <div className="flex items-center text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mr-2" />
                        {providerProfile.location}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      className="flex items-center"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/business/${user?.id}`)}
                      className="flex items-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Public View
                    </Button>
                  </div>
                </div>
                
                {providerDetails?.business_description && (
                  <p className="text-muted-foreground leading-relaxed">
                    {providerDetails.business_description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Business Performance Stats */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  Business Performance
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{providerDetails?.total_reviews || 0}</div>
                    <div className="text-sm text-blue-600">Reviews</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{providerDetails?.rating?.toFixed(1) || '0.0'}</div>
                    <div className="text-sm text-green-600">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{portfolioItems.length}</div>
                    <div className="text-sm text-purple-600">Portfolio</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">{services.length}</div>
                    <div className="text-sm text-amber-600">Services</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            {providerProfile?.bio && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    About
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{providerProfile.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {services.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-primary" />
                    Services Offered
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold">{service.service_name}</h3>
                          <div className="text-right">
                            {service.discount_price && service.discount_price !== service.base_price ? (
                              <div className="flex flex-col items-end">
                                <span className="text-lg font-bold text-primary">£{service.discount_price}</span>
                                <span className="text-sm text-muted-foreground line-through">£{service.base_price}</span>
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-primary">£{service.base_price}</span>
                            )}
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-muted-foreground text-sm mb-2">{service.description}</p>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {service.duration_text || `${service.duration_minutes} minutes`}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio */}
            {portfolioItems.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center">
                      <Camera className="h-5 w-5 mr-2 text-primary" />
                      Featured Portfolio
                    </h2>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/portfolio/${user?.id}`)}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="group cursor-pointer">
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        {item.category && (
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold flex items-center">
                    <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                    Recent Reviews
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.reviewer?.name || 'Anonymous'}</span>
                            <div className="flex">{renderStars(review.rating)}</div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
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
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  Contact Information
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {businessEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{businessEmail}</p>
                      {providerDetails?.business_email !== providerProfile?.email && (
                        <Badge variant="secondary" className="text-xs">Account Email</Badge>
                      )}
                    </div>
                  </div>
                )}

                {providerDetails?.business_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{providerDetails.business_phone}</p>
                    </div>
                  </div>
                )}

                {providerDetails?.business_website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a 
                        href={providerDetails.business_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {providerDetails.business_website}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            {(providerDetails?.business_address || providerProfile?.location) && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    Location
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {providerDetails?.business_address && (
                      <p className="text-sm">{providerDetails.business_address}</p>
                    )}
                    {providerDetails?.business_city && (
                      <p className="text-sm">
                        {providerDetails.business_city}
                        {providerDetails.business_postcode && `, ${providerDetails.business_postcode}`}
                      </p>
                    )}
                    {providerDetails?.coverage_towns && providerDetails.coverage_towns.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Service Areas:</p>
                        <div className="flex flex-wrap gap-1">
                          {providerDetails.coverage_towns.map((town, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {town}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Operating Hours */}
            {operatingHours && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Operating Hours
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(operatingHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between items-center text-sm">
                        <span className="font-medium">{getDayName(day)}</span>
                        <span className="text-muted-foreground">
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Credentials */}
            {(providerDetails?.certifications || providerDetails?.insurance_info || 
              providerDetails?.awards_recognitions || providerDetails?.professional_memberships || 
              providerDetails?.other_qualifications) && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Credentials & Certifications
                  </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providerDetails?.insurance_info && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-provider" />
                        Insurance Information
                      </h4>
                      <div className="space-y-1">
                        {providerDetails.insurance_info.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {providerDetails?.certifications && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-provider" />
                        Certifications & Qualifications
                      </h4>
                      <div className="space-y-1">
                        {providerDetails.certifications.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {providerDetails?.awards_recognitions && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4 text-provider" />
                        Awards & Recognitions
                      </h4>
                      <div className="space-y-1">
                        {providerDetails.awards_recognitions.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {providerDetails?.professional_memberships && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-provider" />
                        Professional Memberships
                      </h4>
                      <div className="space-y-1">
                        {providerDetails.professional_memberships.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {providerDetails?.other_qualifications && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-provider" />
                        Other Training & Qualifications
                      </h4>
                      <div className="space-y-1">
                        {providerDetails.other_qualifications.split('\n').filter(item => item.trim() !== '').map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-provider rounded-full flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Media */}
            {socialConnections.length > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center">
                    <Share2 className="h-4 w-4 mr-2 text-primary" />
                    Social Media
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {socialConnections.map((connection) => (
                      <a
                        key={connection.id}
                        href={connection.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                      >
                        {connection.platform === 'instagram' && <Instagram className="h-4 w-4" />}
                        {connection.platform === 'facebook' && <Facebook className="h-4 w-4" />}
                        <span className="text-sm font-medium">@{connection.handle}</span>
                      </a>
                    ))}
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

export default Profile;