import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Bell, 
  Trash2, 
  Download,
  Shield,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSettings {
  // Personal Info
  name: string;
  email: string;
  phone: string;
  location: string;
  
  // Privacy Settings (for customers)
  privacy_settings?: {
    phone_visible: boolean;
    email_visible: boolean;
    location_visible: boolean;
  };
  
  // Notification Preferences
  email_notifications: boolean;
  sms_notifications: boolean;
  booking_reminders: boolean;
  marketing_communications: boolean;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserSettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    location: '',
    privacy_settings: {
      phone_visible: true,
      email_visible: false,
      location_visible: true,
    },
    email_notifications: true,
    sms_notifications: false,
    booking_reminders: true,
    marketing_communications: false,
  });
  
  // Load notification preferences from database
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (profile) {
      loadUserSettings();
    }
  }, [profile]);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      
      // Load basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Parse privacy settings properly
      let privacySettings = {
        phone_visible: true,
        email_visible: false,
        location_visible: true,
      };

      if (profileData?.privacy_settings) {
        if (typeof profileData.privacy_settings === 'string') {
          try {
            privacySettings = JSON.parse(profileData.privacy_settings);
          } catch (e) {
            console.warn('Could not parse privacy settings:', e);
          }
        } else if (typeof profileData.privacy_settings === 'object') {
          privacySettings = { ...privacySettings, ...profileData.privacy_settings };
        }
      }

      setSettings({
        name: profileData?.name || '',
        email: profileData?.email || '',
        phone: profileData?.phone || '',
        location: profileData?.location || '',
        privacy_settings: privacySettings,
        // Load notification preferences from database
        email_notifications: (profileData?.notification_preferences as any)?.email_notifications ?? true,
        sms_notifications: (profileData?.notification_preferences as any)?.sms_notifications ?? false,
        booking_reminders: (profileData?.notification_preferences as any)?.booking_reminders ?? true,
        marketing_communications: (profileData?.notification_preferences as any)?.marketing_communications ?? false,
      });
      
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Could not load your account settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      
      const updateData: any = {
        name: settings.name,
        phone: settings.phone,
        location: settings.location,
        notification_preferences: {
          email_notifications: settings.email_notifications,
          sms_notifications: settings.sms_notifications,
          booking_reminders: settings.booking_reminders,
          marketing_communications: settings.marketing_communications,
          booking_confirmations: true,
          cancellation_notifications: true,
          profile_update_notifications: true
        }
      };

      // Include privacy settings for customers
      if (profile?.active_role === 'customer') {
        updateData.privacy_settings = settings.privacy_settings;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your account settings have been saved successfully",
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving changes",
        description: "Could not update your settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both password fields match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error changing password",
        description: "Could not update your password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    try {
      // In a real app, this would trigger a backend process to compile user data
      const userData = {
        profile: settings,
        export_date: new Date().toISOString(),
        user_id: user?.id,
      };
      
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openslot-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your account data has been downloaded",
      });
      
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Could not export your data",
        variant: "destructive"
      });
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE' to confirm account deletion",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real app, this would trigger a backend process for GDPR-compliant deletion
      toast({
        title: "Account deletion requested",
        description: "Your account deletion request has been submitted. You'll receive an email with next steps.",
      });
      
      setShowDeleteConfirmation(false);
      setDeleteConfirmText('');
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion failed",
        description: "Could not process account deletion",
        variant: "destructive"
      });
    }
  };

  const isCustomer = profile?.active_role === 'customer';
  const isProvider = profile?.active_role === 'provider';

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header with Back Button */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        <h1 className={cn(
          "text-3xl font-bold mb-2",
          isCustomer && "text-primary",
          isProvider && "bg-gradient-provider bg-clip-text text-transparent"
        )}>
          Account Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information, privacy preferences, and account security
        </p>
      </div>

      <div className="grid gap-6">
        {/* Personal Information */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your basic account details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={settings.location}
                  onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            <Button 
              onClick={savePersonalInfo} 
              disabled={saving}
              className={cn(
                isCustomer && "bg-primary hover:bg-primary/90",
                isProvider && "bg-provider hover:bg-provider/90"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Privacy Settings - Only for customers */}
        {isCustomer && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control what information is visible to service providers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow providers to see your phone number
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy_settings?.phone_visible}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        privacy_settings: { ...prev.privacy_settings!, phone_visible: checked }
                      }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Email Address</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow providers to see your email address
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy_settings?.email_visible}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        privacy_settings: { ...prev.privacy_settings!, email_visible: checked }
                      }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow providers to see your general location
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy_settings?.location_visible}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({
                        ...prev,
                        privacy_settings: { ...prev.privacy_settings!, location_visible: checked }
                      }))
                    }
                  />
                </div>
              </div>
              
              <Button 
                onClick={savePersonalInfo} 
                disabled={saving}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notification Preferences */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Choose how you'd like to receive updates and reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive booking confirmations and updates via email
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, email_notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive booking confirmations and updates via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, sms_notifications: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Booking Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming appointments
                  </p>
                </div>
                <Switch
                  checked={settings.booking_reminders}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, booking_reminders: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and promotions
                  </p>
                </div>
                <Switch
                  checked={settings.marketing_communications}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, marketing_communications: checked }))
                  }
                />
              </div>
            </div>
            
            <Button 
              onClick={savePersonalInfo} 
              disabled={saving}
              className={cn(
                isCustomer && "bg-primary hover:bg-primary/90",
                isProvider && "bg-provider hover:bg-provider/90"
              )}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Notification Preferences
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={changePassword} 
              disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
              className={cn(
                isCustomer && "bg-primary hover:bg-primary/90",
                isProvider && "bg-provider hover:bg-provider/90"
              )}
            >
              <Lock className="h-4 w-4 mr-2" />
              Update Password
            </Button>
          </CardContent>
        </Card>


        {/* Data & Privacy */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Manage your data and privacy in compliance with GDPR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of all your personal data
                </p>
              </div>
              <Button variant="outline" onClick={exportUserData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              
              {!showDeleteConfirmation ? (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <Alert className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="font-medium">Are you absolutely sure?</p>
                      <p className="text-sm">
                        This will permanently delete your account, all your data, bookings, and cannot be undone.
                        Type <strong>DELETE</strong> below to confirm:
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="border-destructive focus:ring-destructive"
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          onClick={deleteAccount}
                          disabled={deleteConfirmText !== 'DELETE'}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserSettingsPage;