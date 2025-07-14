import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Eye, 
  EyeOff,
  Upload,
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin
} from 'lucide-react';

interface BusinessCategory {
  id: string;
  name: string;
  category_type: string;
  description: string;
}

interface SocialMediaLinks {
  [key: string]: string | undefined;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

interface BusinessProfileData {
  business_name: string;
  business_category: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  business_description: string;
  business_logo_url: string;
  operating_hours: string;
  social_media_links: SocialMediaLinks;
  profile_visibility: 'public' | 'private';
  profile_published: boolean;
}

interface BusinessProfileFormProps {
  mode: 'create' | 'edit';
  existingData?: Partial<BusinessProfileData>;
  onSuccess?: () => void;
}

const defaultHours = [
  { day: 'Monday', open: '09:00', close: '17:00', closed: false },
  { day: 'Tuesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Wednesday', open: '09:00', close: '17:00', closed: false },
  { day: 'Thursday', open: '09:00', close: '17:00', closed: false },
  { day: 'Friday', open: '09:00', close: '17:00', closed: false },
  { day: 'Saturday', open: '10:00', close: '16:00', closed: false },
  { day: 'Sunday', open: '10:00', close: '16:00', closed: true },
];

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ 
  mode, 
  existingData, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<BusinessProfileData>({
    business_name: '',
    business_category: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    business_description: '',
    business_logo_url: '',
    operating_hours: JSON.stringify(defaultHours),
    social_media_links: {},
    profile_visibility: 'public',
    profile_published: false,
    ...existingData
  });

  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [operatingHours, setOperatingHours] = useState(defaultHours);
  const [socialLinks, setSocialLinks] = useState<SocialMediaLinks>({});
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    if (existingData) {
      initializeFormData();
    }
  }, [existingData]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('business_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const initializeFormData = () => {
    if (existingData?.operating_hours) {
      try {
        const hours = JSON.parse(existingData.operating_hours);
        setOperatingHours(hours);
      } catch {
        setOperatingHours(defaultHours);
      }
    }

    if (existingData?.social_media_links) {
      setSocialLinks(existingData.social_media_links);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }

    if (!formData.business_category) {
      newErrors.business_category = 'Business category is required';
    }

    if (!formData.business_address.trim()) {
      newErrors.business_address = 'Business address is required';
    }

    if (!formData.business_phone.trim()) {
      newErrors.business_phone = 'Contact number is required';
    }

    if (!formData.business_email.trim()) {
      newErrors.business_email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.business_email)) {
      newErrors.business_email = 'Please enter a valid email address';
    }

    if (formData.business_description.length > 300) {
      newErrors.business_description = 'Description must be 300 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BusinessProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSocialLinkChange = (platform: keyof SocialMediaLinks, value: string) => {
    const updatedLinks = { ...socialLinks, [platform]: value };
    setSocialLinks(updatedLinks);
    setFormData(prev => ({ ...prev, social_media_links: updatedLinks }));
  };

  const handleOperatingHoursChange = (dayIndex: number, field: string, value: string | boolean) => {
    const updatedHours = [...operatingHours];
    updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
    setOperatingHours(updatedHours);
    setFormData(prev => ({ ...prev, operating_hours: JSON.stringify(updatedHours) }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG or PNG image",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image under 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('business-photos')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, business_logo_url: data.publicUrl }));
      
      toast({
        title: "Logo uploaded successfully",
        description: "Your business logo has been uploaded"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        business_name: formData.business_name,
        business_category: formData.business_category,
        business_address: formData.business_address,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
        business_website: formData.business_website,
        business_description: formData.business_description,
        business_logo_url: formData.business_logo_url,
        operating_hours: formData.operating_hours,
        social_media_links: formData.social_media_links as any, // Cast to any for JSONB
        profile_visibility: formData.profile_visibility,
        profile_published: publish,
        user_id: user?.id
      };

      if (mode === 'create') {
        const { error } = await supabase
          .from('provider_details')
          .insert(submitData);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('provider_details')
          .update(submitData)
          .eq('user_id', user?.id);
        
        if (error) throw error;
      }

      toast({
        title: publish ? "Profile published successfully!" : "Profile saved as draft",
        description: publish 
          ? "Your business profile is now live and visible to customers"
          : "Your profile has been saved. You can publish it when ready.",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/business-profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">Profile Preview</h3>
        <p className="text-muted-foreground mb-6">This is how your profile will appear to customers</p>
      </div>

      <Card className="p-8 max-w-2xl mx-auto">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={formData.business_logo_url} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-white">
                {formData.business_name.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div>
            <h2 className="text-3xl font-bold">{formData.business_name || 'Business Name'}</h2>
            <p className="text-lg text-muted-foreground">
              {categories.find(c => c.id === formData.business_category)?.name || 'Business Category'}
            </p>
          </div>

          {formData.business_description && (
            <p className="text-foreground leading-relaxed">{formData.business_description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">{formData.business_address || 'Business Address'}</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm">{formData.business_phone || 'Phone Number'}</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <span className="text-sm">{formData.business_email || 'Email Address'}</span>
            </div>
            {formData.business_website && (
              <div className="flex items-center space-x-3 p-3 bg-background rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
                <span className="text-sm">{formData.business_website}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center space-x-2">
            {formData.profile_visibility === 'public' ? (
              <>
                <Eye className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">Public Profile</span>
              </>
            ) : (
              <>
                <EyeOff className="h-5 w-5 text-orange-500" />
                <span className="text-orange-500 font-medium">Private Profile</span>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => setShowPreview(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Edit
        </Button>
        <Button 
          onClick={() => handleSubmit(false)}
          disabled={loading}
          variant="outline"
        >
          Save as Draft
        </Button>
        <Button 
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Publish Profile
        </Button>
      </div>
    </div>
  );

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {renderPreview()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-primary/5 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {mode === 'create' ? 'Create Your Business Profile' : 'Edit Business Profile'}
          </h1>
          <p className="text-xl text-muted-foreground">
            {mode === 'create' 
              ? 'Set up your professional presence to attract customers'
              : 'Update your business information and settings'
            }
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-8">
            {/* Business Logo Section */}
            <div className="text-center space-y-4">
              <Label className="text-lg font-semibold">Business Logo</Label>
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-border">
                    <AvatarImage src={formData.business_logo_url} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-accent text-white">
                      {formData.business_name.charAt(0) || 'B'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploadingLogo}
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={uploadingLogo}
                        className="h-10 w-10 rounded-full"
                      >
                        {uploadingLogo ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a logo (JPEG/PNG, max 2MB) - Optional but recommended
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="business_name" className="text-sm font-semibold">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Enter your business name"
                  className={errors.business_name ? 'border-destructive' : ''}
                />
                {errors.business_name && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_name}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_category" className="text-sm font-semibold">
                  Business Category <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.business_category} 
                  onValueChange={(value) => handleInputChange('business_category', value)}
                >
                  <SelectTrigger className={errors.business_category ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.business_category && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_category}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_phone" className="text-sm font-semibold">
                  Contact Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_phone"
                  value={formData.business_phone}
                  onChange={(e) => handleInputChange('business_phone', e.target.value)}
                  placeholder="+44 123 456 7890"
                  className={errors.business_phone ? 'border-destructive' : ''}
                />
                {errors.business_phone && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_phone}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_email" className="text-sm font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="business_email"
                  type="email"
                  value={formData.business_email}
                  onChange={(e) => handleInputChange('business_email', e.target.value)}
                  placeholder="business@example.com"
                  className={errors.business_email ? 'border-destructive' : ''}
                />
                {errors.business_email && (
                  <p className="text-sm text-destructive mt-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_email}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="business_website" className="text-sm font-semibold">
                  Website (Optional)
                </Label>
                <Input
                  id="business_website"
                  value={formData.business_website}
                  onChange={(e) => handleInputChange('business_website', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>
            </div>

            {/* Business Address */}
            <div>
              <Label htmlFor="business_address" className="text-sm font-semibold">
                Business Address <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="business_address"
                value={formData.business_address}
                onChange={(e) => handleInputChange('business_address', e.target.value)}
                placeholder="Enter your full business address"
                className={`min-h-[80px] ${errors.business_address ? 'border-destructive' : ''}`}
              />
              {errors.business_address && (
                <p className="text-sm text-destructive mt-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.business_address}
                </p>
              )}
            </div>

            {/* Business Description */}
            <div>
              <Label htmlFor="business_description" className="text-sm font-semibold">
                About Your Business (Optional, max 300 chars)
              </Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                placeholder="Describe your business, services, and what makes you unique..."
                className={`min-h-[120px] ${errors.business_description ? 'border-destructive' : ''}`}
                maxLength={300}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.business_description && (
                  <p className="text-sm text-destructive flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.business_description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground ml-auto">
                  {formData.business_description.length}/300
                </p>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <Label className="text-sm font-semibold mb-4 block">
                Opening Hours <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-3">
                {operatingHours.map((day, index) => (
                  <div key={day.day} className="flex items-center space-x-4 p-3 bg-muted/30 rounded-lg">
                    <div className="w-20 font-medium">{day.day}</div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={!day.closed}
                        onCheckedChange={(checked) => handleOperatingHoursChange(index, 'closed', !checked)}
                      />
                      <span className="text-sm">{day.closed ? 'Closed' : 'Open'}</span>
                    </div>
                    {!day.closed && (
                      <>
                        <Input
                          type="time"
                          value={day.open}
                          onChange={(e) => handleOperatingHoursChange(index, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={day.close}
                          onChange={(e) => handleOperatingHoursChange(index, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Social Media Links */}
            <div>
              <Label className="text-sm font-semibold mb-4 block">Social Media Links (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <Input
                    value={socialLinks.facebook || ''}
                    onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                    placeholder="Facebook URL"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Instagram className="h-5 w-5 text-pink-500" />
                  <Input
                    value={socialLinks.instagram || ''}
                    onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                    placeholder="Instagram URL"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Twitter className="h-5 w-5 text-blue-400" />
                  <Input
                    value={socialLinks.twitter || ''}
                    onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                    placeholder="Twitter URL"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Linkedin className="h-5 w-5 text-blue-700" />
                  <Input
                    value={socialLinks.linkedin || ''}
                    onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
            </div>

            {/* Profile Visibility */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-semibold">Profile Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  Control who can view your business profile
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.profile_visibility === 'public'}
                    onCheckedChange={(checked) => 
                      handleInputChange('profile_visibility', checked ? 'public' : 'private')
                    }
                  />
                  <span className="text-sm font-medium">
                    {formData.profile_visibility === 'public' ? (
                      <>
                        <Eye className="h-4 w-4 inline mr-1 text-green-500" />
                        Public
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 inline mr-1 text-orange-500" />
                        Private
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(true)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Profile
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Profile
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BusinessProfileForm;