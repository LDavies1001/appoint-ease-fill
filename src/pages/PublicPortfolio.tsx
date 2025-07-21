import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Instagram, Facebook, Clock, Shield } from 'lucide-react';
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
}

const PublicPortfolio = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const { toast } = useToast();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Cover Photo Section */}
      <CoverPhotoManager
        coverImageUrl={providerDetails?.cover_image_url}
        providerId={providerId || ''}
        onCoverImageUpdate={() => {}} // No update needed for public view
        isOwner={false}
      />
      
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
                    <span className="text-sm">{providerDetails.operating_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        {providerDetails?.services_offered && providerDetails.services_offered.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Services Offered</h2>
              <div className="flex flex-wrap gap-2">
                {providerDetails.services_offered.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Section */}
        <div className="space-y-6">
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
        </div>
      </div>
    </div>
  );
};

export default PublicPortfolio;