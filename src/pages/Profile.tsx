// @ts-nocheck
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CustomerPortfolio } from '@/components/profile/CustomerPortfolio';
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
  X,
  Bell,
  Settings,
  BarChart3
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
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Use route protection to handle auth state and redirects
  useRouteProtection();

  // Check if current user is the profile owner
  const isOwner = profile?.user_id === user?.id;

  useEffect(() => {
    if (user && profile?.active_role === 'provider') {
      fetchProviderData();
    } else if (user && profile?.active_role === 'customer') {
      fetchCustomerData();
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

  const fetchCustomerData = async () => {
    try {
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;
      setCustomerProfile(profileData);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load your profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 overflow-x-hidden w-full">
        {/* Hero Section - matching Dashboard style */}
        <div className="relative bg-gradient-to-r from-card via-card/95 to-accent/10 border-b border-border/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(120,119,198,0.1),_transparent_50%)]"></div>
          <div className="relative max-w-6xl mx-auto px-8 py-16">
            <div className="text-center space-y-6">
              <div className="relative inline-block mb-6">
                <Avatar className="w-32 h-32 border-4 border-card shadow-xl mx-auto">
                  <AvatarImage src={customerProfile?.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {customerProfile?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
                  {customerProfile?.name || 'Welcome'}
                </h1>
                <p className="text-xl text-muted-foreground/80 leading-relaxed max-w-2xl mx-auto font-medium">
                  {customerProfile?.bio || 'Welcome to your beauty journey'}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2 bg-card border-border text-foreground shadow-sm">
                  <MapPin className="h-4 w-4 mr-2" />
                  {customerProfile?.location || 'Location not set'}
                </Badge>
                <Badge variant="outline" className="px-4 py-2 bg-card border-border text-foreground shadow-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {new Date(customerProfile?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container - matching Dashboard style */}
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="bg-gradient-to-r from-card via-card/95 to-card/90 rounded-3xl p-8 shadow-xl border border-border/50 backdrop-blur-sm">
            {/* Activity Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/10 hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">0</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">Appointments</div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-accent/5 to-primary/5 rounded-2xl border border-accent/10 hover:border-accent/30 transition-all duration-300">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-accent to-accent-glow rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                  <Heart className="h-6 w-6 md:h-8 md:w-8 text-accent-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">0</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">Favorites</div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-secondary/5 to-accent/5 rounded-2xl border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-secondary to-muted rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                  <Star className="h-6 w-6 md:h-8 md:w-8 text-secondary-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">0</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">Reviews</div>
              </div>
              <div className="text-center p-4 md:p-6 bg-gradient-to-br from-tertiary/5 to-primary/5 rounded-2xl border border-tertiary/10 hover:border-tertiary/30 transition-all duration-300">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-tertiary to-background rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-lg">
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-tertiary-foreground" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">0</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">Experiences</div>
              </div>
            </div>

            {/* Content Layout */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Beauty Interests Card */}
                <div className="bg-gradient-to-br from-card via-card/95 to-accent/5 rounded-2xl p-6 md:p-8 border border-border/50 shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Beauty Interests</h2>
                      <p className="text-muted-foreground">Services and treatments you love</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {['Lash Extensions', 'Nail Care', 'Hair Styling', 'Skincare', 'Massage', 'Makeup'].map((category) => (
                      <div 
                        key={category} 
                        className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center shadow-sm">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Portfolio */}
                {user && <CustomerPortfolio customerId={user.id} isOwner={isOwner} />}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-card via-card/95 to-primary/5 rounded-2xl p-6 border border-border/50 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 p-4 h-auto bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40"
                      onClick={() => navigate('/dashboard')}
                    >
                      <BarChart3 className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Dashboard</div>
                        <div className="text-sm text-muted-foreground">Manage your account</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-3 p-4 h-auto bg-gradient-to-r from-accent/5 to-primary/5 border-accent/20 hover:border-accent/40"
                    >
                      <Bell className="h-5 w-5" />
                      <div className="text-left">
                        <div className="font-medium">Notifications</div>
                        <div className="text-sm text-muted-foreground">Stay updated</div>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="bg-gradient-to-br from-card via-card/95 to-accent/5 rounded-2xl p-6 border border-border/50 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg">
                      <span className="font-medium">Profile Status</span>
                      <Badge variant="outline" className="bg-card">Complete</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg">
                      <span className="font-medium">Member Level</span>
                      <Badge variant="outline" className="bg-card">Standard</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const operatingHours = providerDetails ? parseOperatingHours(providerDetails.operating_hours) : [];
  const totalServiceValue = providerServices.reduce((sum, service) => sum + (service.base_price || 0), 0);

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
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services Section */}
            {providerServices.length > 0 && (
              <Card className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-provider to-provider-dark rounded-xl flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Services</h2>
                      <p className="text-muted-foreground">Professional beauty treatments</p>
                    </div>
                  </div>
                  {!isOwner && (
                    <Button onClick={handleBookNow} className="bg-provider hover:bg-provider-dark">
                      Book Now
                    </Button>
                  )}
                </div>

                <div className="grid gap-4">
                  {providerServices.map((service) => (
                    <div key={service.id} className="p-4 border border-border rounded-xl hover:border-provider/30 transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{service.service_name}</h3>
                          {service.description && (
                            <p className="text-muted-foreground mb-3">{service.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{service.duration_text || `${service.duration_minutes} mins`}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-provider">
                            £{service.base_price}
                          </div>
                          {service.discount_price && service.discount_price < service.base_price && (
                            <div className="text-sm text-muted-foreground line-through">
                              £{service.discount_price}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Portfolio Section */}
            {portfolioItems.filter(item => item.is_public || isOwner).length > 0 && (
              <Card className="p-6 lg:p-8" id="portfolio">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Portfolio</h2>
                    <p className="text-muted-foreground">Showcase of our work</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioItems
                    .filter(item => item.is_public || isOwner)
                    .map((item) => (
                      <div key={item.id} className="group relative overflow-hidden rounded-xl bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="font-semibold mb-1">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm opacity-90 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                        {item.featured && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-yellow-500 text-yellow-900 border-0">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          </div>
                        )}
                        {!item.is_public && isOwner && (
                          <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                              Private
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* About Section */}
            <Card className="p-6 lg:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">About</h2>
                  <p className="text-muted-foreground">Get to know us better</p>
                </div>
              </div>

              <div className="space-y-6">
                {providerProfile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">Personal Bio</h3>
                    <p className="text-muted-foreground leading-relaxed">{providerProfile.bio}</p>
                  </div>
                )}

                {providerDetails.years_experience > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Experience</h3>
                    <p className="text-muted-foreground">
                      {providerDetails.years_experience} years of professional experience in the beauty industry
                    </p>
                  </div>
                )}

                {providerDetails.certifications && (
                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    <p className="text-muted-foreground">{providerDetails.certifications}</p>
                  </div>
                )}

                {providerDetails.insurance_info && (
                  <div>
                    <h3 className="font-semibold mb-2">Insurance</h3>
                    <p className="text-muted-foreground">{providerDetails.insurance_info}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-4">
                {providerDetails.business_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-provider" />
                    <div>
                      <p className="font-medium">{providerDetails.business_phone}</p>
                      <p className="text-sm text-muted-foreground">Business Phone</p>
                    </div>
                  </div>
                )}

                {providerDetails.business_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-provider" />
                    <div>
                      <p className="font-medium">{providerDetails.business_email}</p>
                      <p className="text-sm text-muted-foreground">Business Email</p>
                    </div>
                  </div>
                )}

                {providerDetails.business_website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-provider" />
                    <div>
                      <a 
                        href={providerDetails.business_website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-provider hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-sm text-muted-foreground">Business Website</p>
                    </div>
                  </div>
                )}

                {(providerDetails.is_address_public && providerDetails.business_address) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-provider mt-0.5" />
                    <div>
                      <p className="font-medium">{providerDetails.business_address}</p>
                      <p className="text-sm text-muted-foreground">Business Address</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Operating Hours */}
            {operatingHours.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Operating Hours</h3>
                <div className="space-y-2">
                  {operatingHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="font-medium">{schedule.day}</span>
                      <span className="text-muted-foreground">{schedule.hours}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Social Media */}
            {(socialConnections.length > 0 || providerDetails.facebook_url || providerDetails.instagram_url) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
                <div className="space-y-3">
                  {providerDetails.facebook_url && (
                    <a 
                      href={providerDetails.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-provider/30 transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Facebook</span>
                      <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                    </a>
                  )}

                  {providerDetails.instagram_url && (
                    <a 
                      href={providerDetails.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-provider/30 transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-pink-600" />
                      <span className="font-medium">Instagram</span>
                      <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                    </a>
                  )}

                  {socialConnections.map((connection) => (
                    <a 
                      key={connection.id}
                      href={connection.profile_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-provider/30 transition-colors"
                    >
                      <div className="w-5 h-5 bg-gradient-to-r from-provider to-provider-dark rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {connection.platform.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{connection.platform}</span>
                      <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </Card>
            )}

            {/* Service Area */}
            {providerDetails.service_area && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Service Area</h3>
                <div className="flex items-start gap-3">
                  <Map className="h-5 w-5 text-provider mt-0.5" />
                  <p className="text-muted-foreground">{providerDetails.service_area}</p>
                </div>
              </Card>
            )}

            {/* Verification Status */}
            {(providerDetails.identity_verified || providerDetails.address_verified || providerDetails.insurance_verified) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Verification Status</h3>
                <div className="space-y-3">
                  {providerDetails.identity_verified && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Identity Verified</span>
                    </div>
                  )}
                  
                  {providerDetails.address_verified && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Address Verified</span>
                    </div>
                  )}
                  
                  {providerDetails.insurance_verified && (
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Insurance Verified</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
