import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerProfileForm } from '@/components/customer/CustomerProfileForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhotoUpload, DocumentUpload } from '@/components/ui/photo-upload';
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
  Award,
  Edit3,
  Eye,
  CheckCircle,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Save,
  X,
  Upload,
  FileText
} from 'lucide-react';

const Profile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [providerDetails, setProviderDetails] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<any>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Use route protection to handle auth state and redirects
  useRouteProtection();

  useEffect(() => {
    if (user && profile?.role === 'provider') {
      fetchProviderData();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      // Fetch provider details
      const { data: details } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      setProviderDetails(details);
      setEditData(details || {});

      // Fetch featured portfolio items
      const { data: portfolio } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('featured', true)
        .limit(6);

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
        .limit(5);

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.id === profile?.user_id;
  
  // Debug logging - this should show immediately when component loads
  console.log('Profile Debug Info:', {
    userId: user?.id,
    profileUserId: profile?.user_id,
    profileRole: profile?.role,
    isOwner,
    isEditMode,
    userExists: !!user,
    profileExists: !!profile
  });

  // Function to handle edit button click
  const handleEditToggle = () => {
    console.log('Edit button clicked! Current isEditMode:', isEditMode);
    if (isEditMode) {
      // Exiting edit mode - reset data
      setEditData(providerDetails || {});
    }
    setIsEditMode(!isEditMode);
    console.log('Edit mode toggled to:', !isEditMode);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      // Update provider details
      const { error: providerError } = await supabase
        .from('provider_details')
        .update({
          business_name: editData.business_name,
          business_description: editData.business_description,
          business_address: editData.business_address,
          business_phone: editData.business_phone,
          business_email: editData.business_email,
          operating_hours: editData.operating_hours,
          social_media_links: editData.social_media_links,
          certifications: editData.certifications,
          business_logo_url: editData.business_logo_url,
          certification_files: editData.certification_files,
        })
        .eq('user_id', user?.id);

      if (providerError) throw providerError;

      // Update avatar in profiles table if changed
      if (avatarPreview) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            avatar_url: avatarPreview,
          })
          .eq('user_id', user?.id);

        if (profileError) throw profileError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      // Refresh data and exit edit mode
      await fetchProviderData();
      setIsEditMode(false);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
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
      const parsed = JSON.parse(hoursString);
      console.log('Parsed operating hours:', parsed);
      return parsed;
    } catch {
      console.log('Failed to parse operating hours:', hoursString);
      return null;
    }
  };

  const getDayName = (dayKey: string | number) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const numericKey = typeof dayKey === 'string' ? parseInt(dayKey) : dayKey;
    
    // If it's a numeric key (0-6), map to day name
    if (typeof numericKey === 'number' && numericKey >= 0 && numericKey <= 6) {
      return dayNames[numericKey];
    }
    
    // If it's already a day name, return as is (but capitalize)
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

  // Loading state
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

  // Elegant Business Showcase with Edit Capabilities
  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-bg)' }}>
      <Header />
      
      {/* Floating Edit Controls for Owner */}
      {isOwner && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {isEditMode ? (
            <>
              <Button
                onClick={handleSaveProfile}
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white shadow-elegant"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={handleEditToggle}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-elegant"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={handleEditToggle}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-elegant"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      )}

      {/* Hero Cover Section */}
      <div className="relative h-80 bg-gradient-to-br from-primary/20 via-accent/10 to-tertiary overflow-hidden">
        {/* Cover Image Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/15 to-tertiary/20">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-end gap-6 w-full">
            {/* Business Logo */}
            <div className="relative">
              {providerDetails?.business_logo_url ? (
                <img
                  src={providerDetails.business_logo_url}
                  alt="Business Logo"
                  className="w-32 h-32 rounded-2xl object-cover shadow-elegant border-4 border-white"
                />
              ) : (
                <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-elegant border-4 border-white">
                  <Building className="h-16 w-16 text-primary" />
                </div>
              )}
              {isEditMode && (
                <PhotoUpload
                  onUpload={(url) => setEditData({...editData, business_logo_url: url})}
                  bucket="business-photos"
                  folder="logos"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Button size="sm" className="rounded-full w-8 h-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </PhotoUpload>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative ml-4">
              {avatarPreview || profile?.avatar_url ? (
                <img
                  src={avatarPreview || profile?.avatar_url || ''}
                  alt="Profile Picture"
                  className="w-24 h-24 rounded-full object-cover shadow-elegant border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-elegant border-4 border-white">
                  <User className="h-12 w-12 text-primary" />
                </div>
              )}
              {isEditMode && (
                <PhotoUpload
                  onUpload={(url) => setAvatarPreview(url)}
                  bucket="profile-photos"
                  folder="avatars"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <Button size="sm" className="rounded-full w-8 h-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </PhotoUpload>
              )}
            </div>

            {/* Business Title & Actions */}
            <div className="flex-1 text-white">
              <div className="mb-2">
                {isEditMode ? (
                  <Input
                    value={editData.business_name || ''}
                    onChange={(e) => setEditData({...editData, business_name: e.target.value})}
                    className="text-4xl lg:text-5xl font-bold mb-2 bg-white/20 border-white/30 text-white placeholder:text-white/70"
                    placeholder="Enter business name"
                  />
                ) : (
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg">
                    {providerDetails?.business_name || profile?.name || 'Your Beautiful Business'}
                  </h1>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Building className="h-3 w-3 mr-1" />
                    {providerDetails?.business_category || 'Beauty & Wellness'}
                  </Badge>
                  {providerDetails?.profile_published && (
                    <Badge className="bg-accent/80 text-accent-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified Business
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>
                <Button variant="outline" size="lg" className="border-white/80 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm font-semibold">
                  <Heart className="h-5 w-5 mr-2" />
                  Save to Favorites
                </Button>
                <Button variant="outline" size="lg" className="border-white/80 text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm font-semibold">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Business Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* About Card */}
          <Card className="lg:col-span-2 card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-2xl">
                  <Building className="h-6 w-6 mr-3 text-primary" />
                  About Our Business
                </CardTitle>
                {isEditMode && isOwner && (
                  <Button variant="ghost" size="sm">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Business Description */}
              <div>
                <h4 className="font-semibold text-lg mb-3">Our Story</h4>
                {isEditMode ? (
                  <Textarea
                    value={editData.business_description || ''}
                    onChange={(e) => setEditData({...editData, business_description: e.target.value})}
                    placeholder="Tell your business story..."
                    className="min-h-[100px]"
                  />
                ) : providerDetails?.business_description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {providerDetails.business_description}
                  </p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed italic">
                    Welcome to our business! We're dedicated to providing exceptional service.
                  </p>
                )}
              </div>

              {/* Social Media */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Connect With Us
                  {isEditMode && isOwner && (
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const socialMedia = providerDetails?.social_media_links || {};
                    const platforms = [
                      { name: 'Instagram', key: 'instagram', icon: Instagram, color: 'text-pink-600' },
                      { name: 'Facebook', key: 'facebook', icon: Facebook, color: 'text-blue-600' },
                      { name: 'TikTok', key: 'tiktok', icon: Camera, color: 'text-black' },
                      { name: 'Twitter', key: 'twitter', icon: Twitter, color: 'text-blue-400' }
                    ];
                    
                    return platforms.map(platform => {
                      const IconComponent = platform.icon;
                      const hasAccount = socialMedia[platform.key];
                      
                      return isEditMode && isOwner ? (
                        <div key={platform.key} className="space-y-2">
                          <div className="flex items-center p-3 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
                            <IconComponent className={`h-5 w-5 mr-3 ${platform.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm mb-1">{platform.name}</p>
                              <Input
                                value={socialMedia[platform.key] || ''}
                                onChange={(e) => {
                                  const newSocialMedia = { ...socialMedia, [platform.key]: e.target.value };
                                  setEditData({...editData, social_media_links: newSocialMedia});
                                }}
                                placeholder={`@username`}
                                className="text-xs h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ) : hasAccount ? (
                        <a
                          key={platform.key}
                          href={`https://${platform.key}.com/${socialMedia[platform.key].replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-muted rounded-lg hover:bg-muted/80 transition-all group"
                        >
                          <IconComponent className={`h-5 w-5 mr-3 ${platform.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{platform.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{socialMedia[platform.key].replace('@', '')}</p>
                          </div>
                        </a>
                      ) : (
                        <div key={platform.key} className="flex items-center p-3 bg-muted/30 rounded-lg">
                          <IconComponent className="h-5 w-5 mr-3 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-muted-foreground">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">Not connected</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Certifications & Specialties
                  {isEditMode && isOwner && (
                    <DocumentUpload
                      onUpload={(urls) => {
                        const currentFiles = editData.certification_files || [];
                        setEditData({...editData, certification_files: [...currentFiles, ...urls]});
                      }}
                      bucket="certifications"
                      folder="documents"
                      className="ml-auto"
                    >
                      <Button variant="ghost" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </DocumentUpload>
                  )}
                </h4>
                
                {isEditMode ? (
                  <div className="space-y-4">
                    <Input
                      value={editData.certifications || ''}
                      onChange={(e) => setEditData({...editData, certifications: e.target.value})}
                      placeholder="Enter certifications (comma separated)"
                    />
                    
                    {/* Display uploaded certification files */}
                    {editData.certification_files && editData.certification_files.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Uploaded Documents:</p>
                        <div className="flex flex-wrap gap-2">
                          {editData.certification_files.map((fileUrl: string, index: number) => (
                            <div key={index} className="flex items-center p-2 bg-muted rounded-lg text-sm">
                              <FileText className="h-4 w-4 mr-2" />
                              <span className="truncate max-w-[200px]">Document {index + 1}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 ml-2"
                                onClick={() => {
                                  const newFiles = editData.certification_files.filter((_, i: number) => i !== index);
                                  setEditData({...editData, certification_files: newFiles});
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : providerDetails?.certifications ? (
                  <div className="flex flex-wrap gap-2">
                    {providerDetails.certifications.split(',').map((cert: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {cert.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">
                    Professional certifications coming soon
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats & Quick Info */}
          <div className="space-y-6">
            {/* Rating & Reviews */}
            <Card className="card-enhanced">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-yellow-500 fill-current mr-2" />
                  <span className="text-3xl font-bold">
                    {providerDetails?.rating ? providerDetails.rating.toFixed(1) : '5.0'}
                  </span>
                </div>
                <p className="text-muted-foreground mb-2">
                  {providerDetails?.total_reviews || 0} customer reviews
                </p>
                <div className="flex justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(providerDetails?.rating || 5)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Experience & Location */}
            <Card className="card-enhanced">
              <CardContent className="p-6 space-y-4">
                {providerDetails?.years_experience && (
                  <div className="text-center pb-4 border-b">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {providerDetails.years_experience}+ Years
                    </div>
                    <p className="text-sm text-muted-foreground">Professional Experience</p>
                  </div>
                )}
                
                {providerDetails?.business_address && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">Location</p>
                      <p className="text-sm text-muted-foreground">{providerDetails.business_address}</p>
                    </div>
                  </div>
                )}

                {(providerDetails?.business_phone || providerDetails?.business_email) && (
                  <div className="space-y-3 pt-4 border-t">
                    {providerDetails.business_phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-primary mr-3" />
                        <span className="text-sm">{providerDetails.business_phone}</span>
                      </div>
                    )}
                    {providerDetails.business_email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-primary mr-3" />
                        <span className="text-sm">{providerDetails.business_email}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Operating Hours & Address */}
            {(providerDetails?.operating_hours || providerDetails?.business_address) && (
              <Card className="card-enhanced">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2" />
                    Hours & Location
                  </CardTitle>
                  {isEditMode && isOwner && (
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {/* Address */}
                  <div className="space-y-2">
                    <p className="font-medium text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Address
                    </p>
                    {isEditMode ? (
                      <Input
                        value={editData.business_address || ''}
                        onChange={(e) => setEditData({...editData, business_address: e.target.value})}
                        placeholder="Enter business address"
                      />
                    ) : providerDetails?.business_address ? (
                      <div className="flex items-start p-3 bg-muted/30 rounded-lg">
                        <MapPin className="h-4 w-4 text-primary mt-1 mr-3 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm mb-1">Visit Us</p>
                          <p className="text-sm text-muted-foreground">{providerDetails.business_address}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Address not set</p>
                    )}
                  </div>
                  
                  {/* Opening Hours */}
                  {providerDetails?.operating_hours && (
                    <div>
                      <p className="font-medium text-sm mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Opening Hours
                      </p>
                      <div className="space-y-2 text-sm">
                        {(() => {
                          const hours = formatOperatingHours(providerDetails.operating_hours);
                          return hours ? Object.entries(hours).map(([day, timeData]) => {
                            // Handle both string and object formats
                            let displayTime;
                            if (typeof timeData === 'string') {
                              displayTime = timeData;
                            } else if (typeof timeData === 'object' && timeData !== null) {
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
                              <div key={day} className="flex justify-between">
                                <span className="capitalize font-medium">{getDayName(day)}</span>
                                <span className="text-muted-foreground">{displayTime}</span>
                              </div>
                            );
                          }) : (
                            <p className="text-muted-foreground italic">Hours available upon request</p>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {isEditMode && (!providerDetails?.business_address || !providerDetails?.operating_hours) && (
                    <div className="text-center pt-2">
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        {!providerDetails?.business_address ? 'Add Address' : 'Add Hours'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Elegant Tabbed Sections */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="portfolio" className="flex items-center font-medium">
              <Camera className="h-4 w-4 mr-2" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center font-medium">
              <Calendar className="h-4 w-4 mr-2" />
              Services & Pricing
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center font-medium">
              <Users className="h-4 w-4 mr-2" />
              Customer Reviews
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Gallery */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Our Portfolio</h3>
              <p className="text-muted-foreground text-lg">Discover our latest work and creative achievements</p>
            </div>
            
            {portfolioItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {portfolioItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden group hover:shadow-elegant transition-all duration-300 card-enhanced">
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {item.featured && (
                        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                      {item.description && (
                        <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                      )}
                      {item.category && (
                        <Badge variant="outline" className="mt-3">
                          {item.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-16 card-enhanced">
                <Camera className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h4 className="text-2xl font-semibold mb-4">Portfolio Gallery Coming Soon</h4>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  We're curating our most beautiful work to showcase here. Check back soon to see our stunning portfolio!
                </p>
                {isEditMode && isOwner && (
                  <Button className="mt-6" variant="outline">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Portfolio Items
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Services & Pricing */}
          <TabsContent value="services" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Services & Pricing</h3>
              <p className="text-muted-foreground text-lg">Professional services designed to exceed your expectations</p>
            </div>
            
            {(() => {
              try {
                const pricing = providerDetails?.pricing_info ? JSON.parse(providerDetails.pricing_info) : [];
                return pricing.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pricing.map((item: any, index: number) => (
                      <Card key={index} className="hover:shadow-elegant transition-all duration-300 card-enhanced relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-3xl"></div>
                        <CardContent className="p-8 relative">
                          <h4 className="text-xl font-semibold mb-4 text-center">{item.service}</h4>
                          <div className="text-center mb-6">
                            <div className="text-3xl font-bold text-primary mb-2">{item.price}</div>
                            {item.duration && (
                              <p className="text-sm text-muted-foreground">{item.duration} minutes</p>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground text-center mb-6 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" size="lg">
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Now
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center p-16 card-enhanced">
                    <Calendar className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                    <h4 className="text-2xl font-semibold mb-4">Service Menu Coming Soon</h4>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto mb-6">
                      We're crafting the perfect service experience for you. Contact us directly for current offerings and bespoke pricing.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" size="lg">
                        <Phone className="h-4 w-4 mr-2" />
                        Call For Pricing
                      </Button>
                      <Button variant="outline" size="lg">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                    {isEditMode && isOwner && (
                      <Button className="mt-6" variant="default">
                        <Calendar className="h-4 w-4 mr-2" />
                        Add Services
                      </Button>
                    )}
                  </Card>
                );
              } catch {
                return (
                  <Card className="text-center p-16 card-enhanced">
                    <Calendar className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                    <h4 className="text-2xl font-semibold mb-4">Service Menu Coming Soon</h4>
                    <p className="text-muted-foreground">We're updating our service offerings. Please contact us for current pricing.</p>
                  </Card>
                );
              }
            })()}
          </TabsContent>

          {/* Customer Reviews */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4">Customer Love</h3>
              <p className="text-muted-foreground text-lg">Real experiences from our cherished clients</p>
            </div>
            
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-elegant transition-all duration-300 card-enhanced">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < review.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-2xl font-bold text-primary">{review.rating}.0</span>
                      </div>
                      
                      {review.comment && (
                        <blockquote className="text-lg text-foreground mb-6 leading-relaxed">
                          "{review.comment}"
                        </blockquote>
                      )}
                      
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mr-4">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">
                            {review.reviewer?.name || 'Valued Customer'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-16 card-enhanced">
                <Users className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
                <h4 className="text-2xl font-semibold mb-4">Building Our Reputation</h4>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-6">
                  We're just getting started and excited to serve our first customers. Your feedback will help us grow and improve our services.
                </p>
                <Button variant="outline" size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Be Our First Review
                </Button>
              </Card>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Profile;