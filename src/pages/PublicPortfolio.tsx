// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Instagram, Facebook, Clock, Shield, Image, Calendar, Wrench, User, ExternalLink, Award, CheckCircle, Heart, MessageCircle, Camera } from 'lucide-react';

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
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!providerProfile) {
    return (
      <div className="min-h-screen bg-background">
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

  const featuredItems = portfolioItems.filter(item => item.featured).slice(0, 3);
  const topReviews = reviews.filter(review => review.rating >= 4).slice(0, 3);

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
      
      
      {/* Hero Section with Cover Photo */}
      <div className="relative">
        {/* Cover Photo */}
        <div className="relative w-full h-80 bg-gradient-to-br from-primary/20 to-primary-foreground/20 overflow-hidden">
          <CoverPhotoManager
            coverImageUrl={providerDetails?.cover_image_url}
            providerId={providerId || ''}
            onCoverImageUpdate={() => {}}
            isOwner={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Profile Hero Content */}
        <div className="relative -mt-20 z-10">
          <div className="max-w-6xl mx-auto px-4">
            <Card className="backdrop-blur-sm bg-background/95 border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center lg:items-start">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                      <AvatarImage src={providerProfile.avatar_url} alt={displayName} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                        {displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Trust Badges */}
                    <div className="flex gap-2 mt-4">
                      {providerDetails?.years_experience && providerDetails.years_experience > 3 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Award className="h-3 w-3 mr-1" />
                          Experienced Pro
                        </Badge>
                      )}
                      {providerDetails?.rating && providerDetails.rating > 4.5 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Star className="h-3 w-3 mr-1" />
                          Top Rated
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 text-center lg:text-left">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
                      {businessName}
                    </h1>
                    {providerProfile.name !== businessName && (
                      <p className="text-xl text-muted-foreground mb-4">by {displayName}</p>
                    )}
                    
                    {/* Social Proof */}
                    <div className="flex flex-wrap gap-6 justify-center lg:justify-start mb-6">
                      {providerDetails?.rating && (
                        <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(providerDetails.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{providerDetails.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({providerDetails.total_reviews} reviews)
                          </span>
                        </div>
                      )}
                      
                      {providerProfile.location && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{providerProfile.location}</span>
                        </div>
                      )}
                      
                      {providerDetails?.years_experience && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Shield className="h-4 w-4" />
                          <span>{providerDetails.years_experience} years experience</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {(providerProfile.bio || providerDetails?.business_description) && (
                      <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                        {providerDetails?.business_description || providerProfile.bio}
                      </p>
                    )}

                    {/* Social Media */}
                    <div className="mb-6">
                      <SocialMediaLinks 
                        providerId={providerId!}
                        size="lg"
                        className="justify-center lg:justify-start"
                      />
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="lg:text-right space-y-4">
                    <Button 
                      size="lg" 
                      className="w-full lg:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        window.location.href = `/provider/${providerId}/book`;
                      }}
                    >
                      <Calendar className="h-5 w-5 mr-2" />
                      Book Appointment
                    </Button>
                    
                    <div className="space-y-2">
                      {(providerDetails?.business_phone || providerProfile.phone) && (
                        <a 
                          href={`tel:${providerDetails?.business_phone || providerProfile.phone}`}
                          className="flex items-center justify-center lg:justify-end space-x-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Phone className="h-4 w-4" />
                          <span className="font-medium">Call Now</span>
                        </a>
                      )}
                      
                      {providerDetails?.business_email && (
                        <a 
                          href={`mailto:${providerDetails.business_email}`}
                          className="flex items-center justify-center lg:justify-end space-x-2 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">Send Message</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Back Navigation */}
        <div>
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
        </div>

        {/* Featured Portfolio */}
        {featuredItems.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Featured Work</h2>
              <p className="text-muted-foreground">See some of our best results</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-square">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-white/80 line-clamp-2">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Services Showcase */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Our Services</h2>
            <p className="text-muted-foreground">Professional services tailored to your needs</p>
          </div>
          
          {providerServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">Services will be listed here soon.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providerServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2">{service.service_name}</h3>
                        {service.description && (
                          <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{service.duration_minutes} min</span>
                      </div>
                      {service.base_price && (
                        <div className="text-right">
                          <span className="text-2xl font-bold text-primary">
                            £{service.base_price.toFixed(0)}
                          </span>
                          <span className="text-sm text-muted-foreground block">starting from</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Customer Reviews */}
        {topReviews.length > 0 && (
          <section>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">What Customers Say</h2>
              <p className="text-muted-foreground">Real feedback from our valued clients</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topReviews.map((review) => (
                <Card key={review.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
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
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    {review.comment && (
                      <blockquote className="text-muted-foreground mb-4 italic">
                        "{review.comment}"
                      </blockquote>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {review.reviewer?.name?.[0] || 'A'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.reviewer?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Full Portfolio */}
        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Complete Portfolio</h2>
              <p className="text-muted-foreground">Browse all our work and projects</p>
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
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No portfolio items yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {selectedCategory === 'all' 
                    ? `${displayName} is building their portfolio. Check back soon for amazing work!`
                    : `No items found in the "${selectedCategory}" category. Try browsing other categories.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative aspect-square">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.featured && (
                      <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black border-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 leading-tight">{item.title}</h3>
                    {item.category && (
                      <Badge variant="outline" className="mb-2 capitalize">
                        {item.category}
                      </Badge>
                    )}
                    {item.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Contact & Hours Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                Get In Touch
              </h3>
              <div className="space-y-4">
                {providerDetails?.business_email && (
                  <a 
                    href={`mailto:${providerDetails.business_email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">Email Us</p>
                      <p className="text-sm text-muted-foreground">{providerDetails.business_email}</p>
                    </div>
                  </a>
                )}
                
                {(providerDetails?.business_phone || providerProfile.phone) && (
                  <a 
                    href={`tel:${providerDetails?.business_phone || providerProfile.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">Call Us</p>
                      <p className="text-sm text-muted-foreground">
                        {providerDetails?.business_phone || providerProfile.phone}
                      </p>
                    </div>
                  </a>
                )}
                
                {providerDetails?.business_website && (
                  <a 
                    href={providerDetails.business_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Globe className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors">Visit Website</p>
                      <p className="text-sm text-muted-foreground">Learn more about us</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                )}
                
                {providerDetails?.business_address && (
                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Visit Us</p>
                      <p className="text-sm text-muted-foreground">{providerDetails.business_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Opening Hours
              </h3>
              {operatingHours.length === 0 ? (
                <p className="text-muted-foreground">Hours available on request</p>
              ) : (
                <div className="space-y-3">
                  {operatingHours.map((dayInfo, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="font-medium">{dayInfo.day}</span>
                      <span className={`text-sm ${dayInfo.hours.includes('Closed') ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {dayInfo.hours}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {providerDetails?.availability_notes && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <h4 className="font-medium mb-2 text-primary">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground">{providerDetails.availability_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Book?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join our satisfied customers and experience professional service with {businessName}. 
                Book your appointment today!
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  window.location.href = `/provider/${providerId}/book`;
                }}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Your Appointment Now
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default PublicPortfolio;