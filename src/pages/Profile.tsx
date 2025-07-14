import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';
import BusinessProfileForm from '@/components/business/BusinessProfileForm';
import PortfolioManager from '@/components/business/PortfolioManager';

import Header from '@/components/ui/header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { 
  User, 
  Building, 
  Image, 
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Calendar,
  Heart,
  MessageSquare
} from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      fetchProviderData();
    }
  }, [user, profile]);

  const fetchProviderData = async () => {
    try {
      // Fetch provider details
      const { data: details } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      setProviderDetails(details);

      // Fetch featured portfolio items
      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('featured', true)
        .limit(3);

      setPortfolioItems(portfolio || []);

      // Fetch recent reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(name)
        `)
        .eq('reviewee_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching provider data:', error);
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

  const formatOperatingHours = (hoursString: string) => {
    if (!hoursString) return null;
    try {
      return JSON.parse(hoursString);
    } catch {
      return null;
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

  // Business Profile View with Tabs
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Business Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            {providerDetails?.business_logo_url ? (
              <img
                src={providerDetails.business_logo_url}
                alt="Business Logo"
                className="w-20 h-20 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {providerDetails?.business_name || profile.name || 'Your Business'}
              </h1>
              {providerDetails?.business_description && (
                <p className="text-muted-foreground mt-1">{providerDetails.business_description}</p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                {providerDetails?.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{providerDetails.rating}</span>
                    <span className="text-muted-foreground ml-1">
                      ({providerDetails.total_reviews} reviews)
                    </span>
                  </div>
                )}
                {providerDetails?.business_address && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{providerDetails.business_address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="business-info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business-info" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Business Info
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center">
              <Image className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business-info">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessProfileForm 
                  mode="edit" 
                  existingData={providerDetails ? {
                    business_name: providerDetails.business_name || '',
                    business_category: providerDetails.business_category || '',
                    business_address: providerDetails.business_address || '',
                    business_phone: providerDetails.business_phone || '',
                    business_email: providerDetails.business_email || profile.email || '',
                    business_website: providerDetails.business_website || '',
                    business_description: providerDetails.business_description || '',
                    business_logo_url: providerDetails.business_logo_url || '',
                    operating_hours: providerDetails.operating_hours || '',
                    social_media_links: providerDetails.social_media_links || {},
                    profile_visibility: providerDetails.profile_visibility || 'public',
                    profile_published: providerDetails.profile_published || false,
                  } : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioManager />
          </TabsContent>

          <TabsContent value="services">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Services & Pricing</h2>
                <p className="text-muted-foreground">Manage your service offerings</p>
              </div>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Services coming soon</h3>
                  <p className="text-muted-foreground text-center">
                    Service management functionality will be available soon.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Customer Reviews</h2>
                  <p className="text-muted-foreground">See what your customers are saying</p>
                </div>
                {providerDetails?.rating && (
                  <div className="text-center">
                    <div className="text-3xl font-bold">{providerDetails.rating}</div>
                    <div className="flex items-center justify-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(providerDetails.rating)
                              ? 'text-yellow-500 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {providerDetails.total_reviews} reviews
                    </div>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground text-center">
                      Once customers book and complete services, they'll be able to leave reviews.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">{review.reviewer?.name || 'Anonymous'}</span>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="contact">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {providerDetails?.business_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">{providerDetails.business_phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {providerDetails?.business_email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">{providerDetails.business_email}</p>
                      </div>
                    </div>
                  )}
                  
                  {providerDetails?.business_address && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">{providerDetails.business_address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Operating Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  {formatOperatingHours(providerDetails?.operating_hours) ? (
                    <div className="space-y-2">
                      {formatOperatingHours(providerDetails.operating_hours).map((day: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="font-medium">{day.day}</span>
                          <span className={day.closed ? 'text-muted-foreground' : 'text-foreground'}>
                            {day.closed ? 'Closed' : `${day.open}-${day.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No operating hours set</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;