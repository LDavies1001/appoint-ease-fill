import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Instagram, Facebook, Clock, Shield, Image, Calendar, Wrench, User, ExternalLink } from 'lucide-react';
import Header from '@/components/ui/header';
import { SocialMediaLinks } from '@/components/portfolio/SocialMediaLinks';
import { CoverPhotoManager } from '@/components/business/CoverPhotoManager';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  featured: boolean;
  created_at: string;
}

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
  instagram_url: string;
  facebook_url: string;
  rating: number;
  total_reviews: number;
  years_experience: number;
  certifications: string;
  operating_hours: string;
  services_offered: string[];
  cover_image_url: string | null;
  service_area: string;
  availability_notes: string;
  tiktok_url: string;
}

interface ProviderService {
  id: string;
  service_name: string;
  description?: string;
  base_price?: number;
  duration_minutes: number;
  is_active: boolean;
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

const PublicPortfolio = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { toast } = useToast();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        .single();

      if (profileError) throw profileError;
      setProviderProfile(profileData);

      // Fetch provider details
      const { data: detailsData, error: detailsError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', providerId)
        .single();

      if (detailsError && detailsError.code !== 'PGRST116') {
        throw detailsError;
      }
      setProviderDetails(detailsData);

      // Fetch portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', providerId)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (portfolioError) throw portfolioError;
      setPortfolioItems(portfolioData || []);

      // Fetch provider services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('service_name', { ascending: true });

      if (servicesError) throw servicesError;
      setProviderServices(servicesData || []);

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(name)
        `)
        .eq('reviewee_id', providerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

    } catch (error) {
      console.error('Error fetching provider data:', error);
      toast({
        title: "Error",
        description: "Failed to load provider portfolio.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Provider Not Found</h1>
          <p className="text-muted-foreground mb-6">The provider profile you're looking for doesn't exist.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(portfolioItems.map(item => item.category).filter(Boolean)))];
  const filteredItems = selectedCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === selectedCategory);

  const businessName = providerDetails?.business_name || providerProfile.name;
  const displayName = providerProfile.name || 'Provider';

  const formatTime = (time: string) => {
    try {
      return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };

  const parseOperatingHours = (hoursStr?: string) => {
    if (!hoursStr) return [];
    
    try {
      const lines = hoursStr.split('\n');
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      return lines.map((line, index) => ({
        day: dayNames[index] || `Day ${index + 1}`,
        hours: line
      }));
    } catch {
      return [];
    }
  };

  const operatingHours = parseOperatingHours(providerDetails?.operating_hours);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Cover Photo Section */}
      <div className="relative w-full h-64 bg-muted overflow-hidden">
        <CoverPhotoManager
          coverImageUrl={providerDetails?.cover_image_url}
          providerId={providerId || ''}
          onCoverImageUpdate={() => {}} // No update needed for public view
          isOwner={false}
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>

        {/* Provider Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage src={providerProfile.avatar_url} alt={displayName} />
                <AvatarFallback className="text-xl">
                  {displayName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2">{businessName}</h1>
                {providerProfile.name !== businessName && (
                  <p className="text-lg text-muted-foreground mb-2">by {displayName}</p>
                )}
                
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-4">
                  {providerDetails?.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{providerDetails.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({providerDetails.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                  
                  {providerProfile.location && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{providerProfile.location}</span>
                    </div>
                  )}
                  
                  {providerDetails?.years_experience && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">{providerDetails.years_experience} years experience</span>
                    </div>
                  )}
                </div>

                {(providerProfile.bio || providerDetails?.business_description) && (
                  <p className="text-muted-foreground mb-4">
                    {providerDetails?.business_description || providerProfile.bio}
                  </p>
                )}

                {/* Social Media Links */}
                <div className="mb-4">
                  <SocialMediaLinks 
                    providerId={providerId!}
                    size="md"
                    className="justify-center md:justify-start"
                  />
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {(providerDetails?.business_phone || providerProfile.phone) && (
                    <a 
                      href={`tel:${providerDetails?.business_phone || providerProfile.phone}`}
                      className="flex items-center space-x-1 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{providerDetails?.business_phone || providerProfile.phone}</span>
                    </a>
                  )}
                  
                  {providerDetails?.business_website && (
                    <a 
                      href={providerDetails.business_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Website</span>
                    </a>
                  )}
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <Button 
                  size="lg" 
                  className="mb-4"
                  onClick={() => {
                    // Redirect to provider's availability or booking page
                    window.location.href = `/provider/${providerId}/book`;
                  }}
                >
                  Book Appointment
                </Button>
                {providerDetails?.operating_hours && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">View hours below</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Business Information</h3>
                  <div className="space-y-3">
                    {providerDetails?.service_area && (
                      <div>
                        <strong>Service Area:</strong> {providerDetails.service_area}
                      </div>
                    )}
                    {providerDetails?.years_experience && (
                      <div>
                        <strong>Experience:</strong> {providerDetails.years_experience} years
                      </div>
                    )}
                    {providerDetails?.certifications && (
                      <div>
                        <strong>Certifications:</strong> {providerDetails.certifications}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {providerDetails?.business_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${providerDetails.business_email}`} className="text-primary hover:underline">
                          {providerDetails.business_email}
                        </a>
                      </div>
                    )}
                    {(providerDetails?.business_phone || providerProfile.phone) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${providerDetails?.business_phone || providerProfile.phone}`} className="text-primary hover:underline">
                          {providerDetails?.business_phone || providerProfile.phone}
                        </a>
                      </div>
                    )}
                    {providerDetails?.business_website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <a href={providerDetails.business_website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Visit Website
                          <ExternalLink className="h-3 w-3 ml-1 inline" />
                        </a>
                      </div>
                    )}
                    {providerDetails?.business_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1" />
                        <span>{providerDetails.business_address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Availability Notes */}
            {providerDetails?.availability_notes && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Availability Notes</h3>
                  <p className="text-muted-foreground">{providerDetails.availability_notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Services Offered</h2>
                {providerServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No services listed yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {providerServices.map((service) => (
                      <Card key={service.id} className="border-border/50">
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{service.service_name}</h3>
                          {service.description && (
                            <p className="text-muted-foreground text-sm mb-3">{service.description}</p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {service.duration_minutes} minutes
                            </span>
                            {service.base_price && (
                              <span className="font-semibold">
                                £{service.base_price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Portfolio</h2>
                <p className="text-muted-foreground">See examples of {displayName}'s work</p>
              </div>
              
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category === 'all' ? 'All Work' : category}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
                    <p className="text-muted-foreground">
                      {selectedCategory === 'all' 
                        ? `${displayName} hasn't uploaded any portfolio items yet.`
                        : `No items found in the "${selectedCategory}" category.`
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {item.featured && (
                        <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 leading-tight">{item.title}</h3>
                      {item.category && (
                        <Badge variant="outline" className="mb-2">
                          {item.category}
                        </Badge>
                      )}
                      {item.description && (
                        <p className="text-muted-foreground text-sm">{item.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Operating Hours Tab */}
          <TabsContent value="hours">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Operating Hours</h2>
                {operatingHours.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Operating hours not specified.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {operatingHours.map((dayInfo, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="font-medium">{dayInfo.day}</span>
                        <span className="text-muted-foreground">{dayInfo.hours}</span>
                      </div>
                    ))}
                  </div>
                )}
                {providerDetails?.availability_notes && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Additional Notes</h3>
                    <p className="text-sm text-muted-foreground">{providerDetails.availability_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/50 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.reviewer?.name || 'Anonymous'}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PublicPortfolio;