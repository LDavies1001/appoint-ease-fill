// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Clock, 
  Calendar,
  Heart,
  HeartOff,
  ExternalLink,
  Camera,
  Award,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BusinessProfile {
  id: string;
  business_name: string;
  business_description: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  business_logo_url: string;
  cover_image_url: string;
  rating: number;
  total_reviews: number;
  years_experience: number;
  certifications: string;
  operating_hours: string;
  service_area: string;
  profile_published: boolean;
  emergency_available: boolean;
  user: {
    name: string;
    avatar_url: string;
  };
  services: Array<{
    id: string;
    service_name: string;
    description: string;
    base_price: number;
    duration_minutes: number;
  }>;
  portfolio_items: Array<{
    id: string;
    title: string;
    image_url: string;
    category: string;
  }>;
}

export default function CustomerBusinessView() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (providerId) {
      fetchBusinessProfile();
      if (user) {
        checkFavoriteStatus();
      }
    }
  }, [providerId, user]);

  const fetchBusinessProfile = async () => {
    try {
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select(`
          *,
          user:profiles!provider_details_user_id_fkey(name, avatar_url)
        `)
        .eq('user_id', providerId)
        .eq('profile_published', true)
        .maybeSingle();

      if (providerError) throw providerError;
      if (!providerData) throw new Error('Business profile not found');

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('provider_services')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Fetch portfolio items
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio_items')
        .select('id, title, image_url, category')
        .eq('provider_id', providerId)
        .eq('is_public', true)
        .limit(6);

      if (portfolioError) throw portfolioError;

      setBusiness({
        ...providerData,
        user: Array.isArray(providerData.user) ? providerData.user[0] : providerData.user,
        services: servicesData || [],
        portfolio_items: portfolioData || []
      });
    } catch (error) {
      console.error('Error fetching business profile:', error);
      toast.error('Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_favourites')
        .select('id')
        .eq('customer_id', user?.id)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('customer_favourites')
          .delete()
          .eq('customer_id', user.id)
          .eq('provider_id', providerId);

        if (error) throw error;
        setIsFavorite(false);
        toast.success('Removed from favorites');
      } else {
        const { error } = await supabase
          .from('customer_favourites')
          .insert({
            customer_id: user.id,
            provider_id: providerId
          });

        if (error) throw error;
        setIsFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'B';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
              <p className="text-muted-foreground mb-4">
                This business profile is not available or doesn't exist.
              </p>
              <Button onClick={() => navigate('/discover')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Discovery
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/discover')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Discovery
            </Button>
            
            {user && (
              <Button
                variant={isFavorite ? "default" : "outline"}
                onClick={toggleFavorite}
                className="flex items-center gap-2"
              >
                {isFavorite ? (
                  <>
                    <Heart className="h-4 w-4 fill-current" />
                    Favorited
                  </>
                ) : (
                  <>
                    <HeartOff className="h-4 w-4" />
                    Add to Favorites
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Cover Image */}
          {business.cover_image_url && (
            <div className="relative h-48 md:h-64 rounded-lg overflow-hidden mb-6">
              <img
                src={business.cover_image_url}
                alt="Business cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Business Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Business Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={business.business_logo_url || business.user?.avatar_url} />
                      <AvatarFallback className="text-xl">
                        {getInitials(business.business_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2">{business.business_name}</h1>
                      
                      <div className="flex items-center gap-2 mb-3">
                        {business.rating > 0 && (
                          <>
                            <div className="flex items-center gap-1">
                              {renderStars(business.rating)}
                            </div>
                            <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({business.total_reviews} reviews)
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {business.years_experience > 0 && (
                          <Badge variant="secondary">
                            <Award className="h-3 w-3 mr-1" />
                            {business.years_experience} years experience
                          </Badge>
                        )}
                        {business.emergency_available && (
                          <Badge variant="destructive">Emergency Available</Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground">{business.business_description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Services & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  {business.services.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {business.services.map((service) => (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{service.service_name}</h3>
                            <span className="font-bold text-primary">
                              £{service.base_price}
                            </span>
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.duration_minutes} minutes
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No services available</p>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio */}
              {business.portfolio_items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {business.portfolio_items.map((item) => (
                        <div key={item.id} className="aspect-square rounded-lg overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => navigate(`/portfolio/${providerId}`)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Portfolio
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact & Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact & Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {business.business_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <span className="text-sm">{business.business_address}</span>
                    </div>
                  )}
                  
                  {business.business_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.business_phone}`} className="text-sm hover:underline">
                        {business.business_phone}
                      </a>
                    </div>
                  )}
                  
                  {business.business_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.business_email}`} className="text-sm hover:underline">
                        {business.business_email}
                      </a>
                    </div>
                  )}
                  
                  {business.business_website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={business.business_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  <Separator />

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/provider/${providerId}/book`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              {business.operating_hours && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Operating Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap">
                      {business.operating_hours}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {/* Service Area */}
              {business.service_area && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Service Area
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{business.service_area}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}