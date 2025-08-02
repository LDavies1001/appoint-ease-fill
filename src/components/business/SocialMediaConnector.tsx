import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Instagram, 
  Facebook, 
  Globe,
  ExternalLink,
  Trash2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  profile_picture_url?: string;
  is_active: boolean;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  placeholder: string;
  example: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
    description: "Share your Instagram profile to showcase your visual portfolio",
    placeholder: 'https://instagram.com/yourusername',
    example: 'https://instagram.com/yourbusiness'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    description: "Link your Facebook page to build trust and show reviews",
    placeholder: 'https://facebook.com/yourpage',
    example: 'https://facebook.com/yourbusiness'
  },
  {
    id: 'website',
    name: 'Website',
    icon: Globe,
    color: 'bg-gradient-to-r from-green-600 to-green-700',
    description: "Add your business website for customers to learn more",
    placeholder: 'https://yourwebsite.com',
    example: 'https://yourbusiness.com'
  }
];

export const SocialMediaConnector: React.FC = () => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }
  }, [user?.id]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setConnections(data || []);
      
      // Populate input fields with existing URLs
      const urlMap: Record<string, string> = {};
      data?.forEach(conn => {
        urlMap[conn.platform] = conn.profile_url;
      });
      setUrlInputs(urlMap);
    } catch (error) {
      console.error('Error fetching social connections:', error);
      toast({
        title: "Error loading connections",
        description: "Could not load your social media connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (platformId: string) => {
    return connections.some(conn => conn.platform === platformId);
  };

  const getConnection = (platformId: string) => {
    return connections.find(conn => conn.platform === platformId);
  };

  const validateUrl = (url: string, platform: SocialPlatform) => {
    if (!url.trim()) return false;
    
    try {
      const urlObj = new URL(url);
      
      // Check if it's a valid URL with http/https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // For Instagram and Facebook, check if the domain matches
      if (platform.id === 'instagram' && !urlObj.hostname.includes('instagram.com')) {
        return false;
      }
      if (platform.id === 'facebook' && !urlObj.hostname.includes('facebook.com')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const extractHandle = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.replace(/\/$/, ''); // Remove trailing slash
      const parts = pathname.split('/').filter(Boolean);
      return parts[0] || 'profile';
    } catch {
      return 'profile';
    }
  };

  const handleSaveConnection = async (platform: SocialPlatform) => {
    const url = urlInputs[platform.id]?.trim();
    
    if (!url) {
      toast({
        title: "URL required",
        description: `Please enter your ${platform.name} URL`,
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(url, platform)) {
      toast({
        title: "Invalid URL",
        description: `Please enter a valid ${platform.name} URL starting with https://`,
        variant: "destructive"
      });
      return;
    }

    try {
      const handle = extractHandle(url);

      // First, check if a connection already exists and deactivate it
      const { error: deactivateError } = await supabase
        .from('social_media_connections')
        .update({ is_active: false })
        .eq('provider_id', user?.id)
        .eq('platform', platform.id);

      if (deactivateError) {
        console.warn('Could not deactivate existing connection:', deactivateError);
      }

      // Then insert the new connection
      const { error } = await supabase
        .from('social_media_connections')
        .insert({
          provider_id: user?.id,
          platform: platform.id,
          handle: handle,
          profile_url: url,
          is_active: true
        });

      if (error) throw error;

      await fetchConnections();

      toast({
        title: `${platform.name} connected!`,
        description: `Your ${platform.name} profile will now appear on your public page.`
      });
    } catch (error) {
      console.error('Error connecting social media:', error);
      toast({
        title: "Connection failed",
        description: `Could not connect your ${platform.name} account`,
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async (connection: SocialConnection) => {
    try {
      const { error } = await supabase
        .from('social_media_connections')
        .update({ is_active: false })
        .eq('id', connection.id);

      if (error) throw error;

      // Clear the input field
      setUrlInputs(prev => ({ ...prev, [connection.platform]: '' }));
      
      await fetchConnections();
      const platform = SOCIAL_PLATFORMS.find(p => p.id === connection.platform);
      
      toast({
        title: `${platform?.name} disconnected`,
        description: "Your profile link has been removed from your public page."
      });
    } catch (error) {
      console.error('Error disconnecting social media:', error);
      toast({
        title: "Disconnection failed",
        description: "Could not disconnect your account",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading social connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-provider to-provider-glow rounded-full mb-4 shadow-elegant">
          <div className="text-3xl">📱</div>
        </div>
        <h3 className="text-3xl font-bold bg-gradient-provider bg-clip-text text-transparent">Connect Your Socials</h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Add your social media profiles and website to help customers discover your work and build trust in your business.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1 max-w-2xl mx-auto">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const connection = getConnection(platform.id);
          const Icon = platform.icon;
          const currentUrl = urlInputs[platform.id] || '';

          return (
            <div 
              key={platform.id} 
              className={cn(
                "relative group rounded-xl border-2 transition-all duration-300 hover:shadow-elegant animate-fade-in",
                connected 
                  ? "bg-white border-provider/30 shadow-elegant" 
                  : "bg-white/80 border-provider/10 hover:border-provider/30"
              )}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-3 rounded-xl shadow-sm",
                    platform.color
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{platform.name}</h4>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                  
                  {connected && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-provider/10 border border-provider/20">
                      <div className="w-2 h-2 rounded-full bg-provider"></div>
                      <span className="text-xs font-medium text-provider">Connected</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor={`${platform.id}-url`} className="text-sm font-medium">
                    {platform.name} URL
                  </Label>
                  <Input
                    id={`${platform.id}-url`}
                    type="url"
                    placeholder={platform.placeholder}
                    value={currentUrl}
                    onChange={(e) => setUrlInputs(prev => ({ 
                      ...prev, 
                      [platform.id]: e.target.value 
                    }))}
                    className="border-provider/30 focus:border-provider focus:ring-provider/20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: {platform.example}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleSaveConnection(platform)}
                    disabled={!currentUrl.trim() || currentUrl === connection?.profile_url}
                    variant="provider"
                    size="sm"
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {connected ? 'Update' : 'Save'} {platform.name}
                  </Button>
                  
                  {connected && connection && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(connection.profile_url, '_blank')}
                        className="border-provider/30 hover:border-provider hover:bg-provider/5"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection)}
                        className="border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {connected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-provider to-provider-glow rounded-t-xl"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-r from-provider/5 to-provider-glow/5 rounded-xl p-6 border border-provider/20 max-w-2xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-provider/10 rounded-full flex items-center justify-center">
            <div className="text-2xl">🛡️</div>
          </div>
          <div>
            <h4 className="font-semibold text-provider mb-2">Your Privacy is Protected</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We only display your public profile links to help customers find and trust your business. 
              We never post on your behalf or access private information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};