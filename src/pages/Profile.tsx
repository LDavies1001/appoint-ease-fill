import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  Star, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Calendar,
  Heart,
  MessageSquare,
  Camera,
  Users,
  Award
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

  // Customer-Facing Business Showcase
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Business Logo/Image */}
            <div className="flex-shrink-0">
              {providerDetails?.business_logo_url ? (
                <img
                  src={providerDetails.business_logo_url}
                  alt="Business Logo"
                  className="w-32 h-32 rounded-2xl object-cover shadow-lg border-2 border-white"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary/70 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building className="h-16 w-16 text-white" />
                </div>
              )}
            </div>

            {/* Business Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
                {providerDetails?.business_name || profile.name || 'Your Business'}
              </h1>
              
              {providerDetails?.business_description && (
                <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                  {providerDetails.business_description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 mb-6">
                {providerDetails?.rating && (
                  <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-full">
                    <Star className="h-5 w-5 text-yellow-500 mr-2 fill-current" />
                    <span className="font-bold text-lg mr-1">{providerDetails.rating}</span>
                    <span className="text-muted-foreground">
                      ({providerDetails.total_reviews} reviews)
                    </span>
                  </div>
                )}
                
                {providerDetails?.years_experience && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {providerDetails.years_experience} years experience
                  </Badge>
                )}
              </div>

              {providerDetails?.business_address && (
                <div className="flex items-center text-muted-foreground mb-6">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <span className="text-lg">{providerDetails.business_address}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Now
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5 mr-2" />
                  Save Business
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections with Tabs */}
      <div className="container mx-auto px-4 py-12">
        {/* Quick Business Overview */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">About Our Business</h2>
          <div className="max-w-3xl mx-auto">
            {providerDetails?.business_description ? (
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {providerDetails.business_description}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Welcome to our business! We're dedicated to providing exceptional service and creating memorable experiences for our clients.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {providerDetails?.years_experience && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{providerDetails.years_experience}+</div>
                  <p className="text-muted-foreground">Years Experience</p>
                </div>
              )}
              
              {providerDetails?.total_reviews > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{providerDetails.total_reviews}</div>
                  <p className="text-muted-foreground">Happy Customers</p>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {providerDetails?.rating ? providerDetails.rating.toFixed(1) : '5.0'}
                </div>
                <p className="text-muted-foreground">Star Rating</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="portfolio" className="flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Our Work</h3>
              <p className="text-muted-foreground">See examples of our recent projects and creative work</p>
            </div>
            
            {portfolioItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-12">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Portfolio Coming Soon</h4>
                <p className="text-muted-foreground">We're currently building our portfolio. Check back soon to see our amazing work!</p>
              </Card>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Our Services</h3>
              <p className="text-muted-foreground">Professional services tailored to meet your specific needs</p>
            </div>
            
            {(() => {
              try {
                const pricing = providerDetails?.pricing_info ? JSON.parse(providerDetails.pricing_info) : [];
                return pricing.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pricing.map((item: any, index: number) => (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 text-center">
                          <h4 className="text-xl font-semibold mb-4">{item.service}</h4>
                          <div className="text-3xl font-bold text-primary mb-4">{item.price}</div>
                          <Button className="w-full" size="lg">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book This Service
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center p-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Custom Services Available</h4>
                    <p className="text-muted-foreground mb-6">We offer personalized services to meet your unique requirements. Contact us to discuss your needs and get a custom quote.</p>
                    <Button size="lg">
                      <Phone className="h-4 w-4 mr-2" />
                      Get Custom Quote
                    </Button>
                  </Card>
                );
              } catch {
                return (
                  <Card className="text-center p-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-xl font-semibold mb-2">Services Available</h4>
                    <p className="text-muted-foreground">Contact us to learn about our services and pricing</p>
                  </Card>
                );
              }
            })()}
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Customer Reviews</h3>
              <p className="text-muted-foreground">Real feedback from our valued clients</p>
            </div>

            {reviews.length === 0 ? (
              <Card className="text-center p-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-2">Building Our Reputation</h4>
                <p className="text-muted-foreground mb-6">We're excited to serve you and earn your first review! Every great business starts with one satisfied customer.</p>
                <Button size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  Be Our First Review
                </Button>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review) => (
                    <Card key={review.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-4">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mb-4 italic">"{review.comment}"</p>
                        )}
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="font-medium">{review.reviewer?.name || 'Customer'}</span>
                            <p className="text-sm text-muted-foreground">Verified Customer</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Get In Touch</h3>
              <p className="text-muted-foreground">Ready to book or have questions? We'd love to hear from you</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <p className="text-muted-foreground text-sm">{providerDetails?.business_email || profile.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <p className="text-muted-foreground text-sm">
                        {providerDetails?.business_phone || 'No phone number added'}
                      </p>
                    </div>
                  </div>

                  {providerDetails?.business_website && (
                    <div className="flex items-center space-x-3">
                      <Building className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-sm">Website</p>
                        <a 
                          href={providerDetails.business_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {providerDetails.business_website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm mb-1">Business Location</p>
                      {providerDetails?.business_address ? (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {providerDetails.business_address}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-sm italic">
                          No address added yet
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    Opening Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const hours = formatOperatingHours(providerDetails?.operating_hours);
                    return hours ? (
                      <div className="space-y-4">
                        {Object.entries(hours).map(([day, timeData]) => {
                          // Handle both string and object formats
                          let displayTime;
                          if (typeof timeData === 'string') {
                            displayTime = timeData;
                          } else if (typeof timeData === 'object' && timeData !== null) {
                            // Handle object format like {open: "9:00", close: "17:00", closed: false}
                            const hoursObj = timeData as any;
                            if (hoursObj.closed) {
                              displayTime = 'Closed';
                            } else if (hoursObj.open && hoursObj.close) {
                              displayTime = `${hoursObj.open} - ${hoursObj.close}`;
                            } else {
                              displayTime = 'Contact for hours';
                            }
                          } else {
                            displayTime = 'Contact for hours';
                          }

                          return (
                            <div key={day} className="flex justify-between items-center py-2 border-b last:border-b-0">
                              <span className="font-medium capitalize">{day}</span>
                              <span className="text-muted-foreground">{displayTime}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Contact us for our current operating hours
                        </p>
                      </div>
                    );
                  })()}
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