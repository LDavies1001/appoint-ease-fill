import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Instagram, 
  Facebook, 
  Music, 
  Twitter, 
  Youtube,
  Plus,
  Check,
  X,
  ExternalLink,
  Trash2
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
  hoverColor: string;
  description: string;
  placeholder: string;
  urlTemplate: string;
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
    hoverColor: 'hover:from-purple-600 hover:via-pink-600 hover:to-orange-600',
    description: "Connect your Instagram to showcase your visual portfolio and attract more customers.",
    placeholder: '@username',
    urlTemplate: 'https://instagram.com/'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    hoverColor: 'hover:from-blue-700 hover:to-blue-800',
    description: "Link your Facebook page to build trust and show customer reviews.",
    placeholder: 'your.page.name',
    urlTemplate: 'https://facebook.com/'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-gradient-to-r from-black via-gray-900 to-red-600',
    hoverColor: 'hover:from-gray-900 hover:via-black hover:to-red-700',
    description: "Connect TikTok to show your creative process and behind-the-scenes content.",
    placeholder: '@username',
    urlTemplate: 'https://tiktok.com/'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    description: "Share updates and engage with customers on X (formerly Twitter).",
    placeholder: '@username',
    urlTemplate: 'https://x.com/'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-gradient-to-r from-red-600 to-red-700',
    hoverColor: 'hover:from-red-700 hover:to-red-800',
    description: "Showcase video tutorials, testimonials, and your work process.",
    placeholder: '@channel',
    urlTemplate: 'https://youtube.com/'
  }
];

export const SocialMediaConnector: React.FC = () => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualEntry, setManualEntry] = useState<Record<string, string>>({});
  const [showManualEntry, setShowManualEntry] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      fetchConnections();
    }

    // Check for OAuth callback success/error
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');
    const status = urlParams.get('status');
    const error = urlParams.get('error');

    if (platform && status === 'success') {
      toast({
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} connected!`,
        description: `Your ${platform} profile will now appear on your public page.`
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
      fetchConnections();
    } else if (error) {
      toast({
        title: "Connection failed",
        description: decodeURIComponent(error),
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user?.id, toast]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setConnections(data || []);
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

  const handleOAuthConnect = async (platform: SocialPlatform) => {
    try {
      // Call our OAuth init function
      const response = await supabase.functions.invoke('social-oauth-init', {
        body: {
          platform: platform.id,
          userId: user?.id,
          redirectUrl: window.location.origin + '/create-business-profile'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { authUrl } = response.data;
      
      // Open OAuth popup or redirect
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        // Fallback to manual entry if OAuth not configured
        setShowManualEntry(prev => ({ ...prev, [platform.id]: true }));
        toast({
          title: "Manual entry mode",
          description: `OAuth for ${platform.name} is not configured. Please enter your details manually.`
        });
      }
    } catch (error) {
      console.error('OAuth initialization error:', error);
      // Fallback to manual entry
      setShowManualEntry(prev => ({ ...prev, [platform.id]: true }));
      toast({
        title: "Connection method",
        description: "Please enter your social media details manually.",
        variant: "default"
      });
    }
  };

  const handleManualConnect = async (platform: SocialPlatform) => {
    const handle = manualEntry[platform.id]?.trim();
    if (!handle) {
      toast({
        title: "Handle required",
        description: `Please enter your ${platform.name} handle`,
        variant: "destructive"
      });
      return;
    }

    try {
      const cleanHandle = handle.startsWith('@') ? handle.slice(1) : handle;
      const profileUrl = `${platform.urlTemplate}${cleanHandle}`;

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
          handle: cleanHandle,
          profile_url: profileUrl,
          is_active: true
        });

      if (error) throw error;

      await fetchConnections();
      setManualEntry(prev => ({ ...prev, [platform.id]: '' }));
      setShowManualEntry(prev => ({ ...prev, [platform.id]: false }));

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
      <Card>
        <CardHeader>
          <CardTitle>Connect Your Socials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
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
          Showcase your work and build trust by connecting your social media profiles. This enhances your credibility and helps customers discover your amazing work.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const connection = getConnection(platform.id);
          const Icon = platform.icon;

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
              {/* Platform Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-xl shadow-sm",
                      platform.color
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{platform.name}</h4>
                      <p className="text-xs text-muted-foreground">Social Platform</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="shrink-0">
                    {connected ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-provider/10 border border-provider/20">
                        <div className="w-2 h-2 rounded-full bg-provider"></div>
                        <span className="text-xs font-medium text-provider">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 border border-muted">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
                        <span className="text-xs font-medium text-muted-foreground">Not connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connected State */}
                {connected && connection ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-provider/5 border border-provider/20">
                      <p className="font-medium text-sm text-provider">@{connection.handle}</p>
                      <p className="text-xs text-muted-foreground truncate">{connection.profile_url}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(connection.profile_url, '_blank')}
                        className="flex-1 border-provider/30 hover:border-provider hover:bg-provider/5"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection)}
                        className="border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Not Connected State */
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/30 border border-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        {platform.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Example: {platform.placeholder}
                      </p>
                    </div>

                    {/* Manual Entry Form */}
                    {showManualEntry[platform.id] ? (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`${platform.id}-handle`} className="text-sm font-medium text-provider">
                            Enter your {platform.name} handle
                          </Label>
                          <Input
                            id={`${platform.id}-handle`}
                            placeholder={platform.placeholder}
                            value={manualEntry[platform.id] || ''}
                            onChange={(e) => setManualEntry(prev => ({ 
                              ...prev, 
                              [platform.id]: e.target.value 
                            }))}
                            className="border-provider/30 focus:border-provider focus:ring-provider/20"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleManualConnect(platform)}
                            disabled={!manualEntry[platform.id]?.trim()}
                            variant="provider"
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Connect Account
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowManualEntry(prev => ({ 
                              ...prev, 
                              [platform.id]: false 
                            }))}
                            className="border-muted-foreground/30"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Connection Buttons */
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleOAuthConnect(platform)}
                          className={cn(
                            "w-full transition-all duration-200 shadow-sm",
                            platform.color,
                            platform.hoverColor,
                            "text-white border-0 hover:shadow-md"
                          )}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Connect with {platform.name}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowManualEntry(prev => ({ ...prev, [platform.id]: true }))}
                          className="w-full text-muted-foreground hover:text-provider hover:bg-provider/5"
                        >
                          Enter manually instead
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Connected indicator border */}
              {connected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-provider to-provider-glow rounded-t-xl"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Privacy Section */}
      <div className="bg-gradient-to-r from-provider/5 to-provider-glow/5 rounded-xl p-6 border border-provider/20">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-provider/10 rounded-full flex items-center justify-center">
            <div className="text-2xl">🛡️</div>
          </div>
          <div>
            <h4 className="font-semibold text-provider mb-2">Your Privacy is Protected</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We only display your public handle and profile link to help customers find and trust your business. 
              We never post on your behalf, access private information, or share your data with third parties.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can always add, remove, or update your social accounts later from your dashboard
        </p>
      </div>
    </div>
  );
};