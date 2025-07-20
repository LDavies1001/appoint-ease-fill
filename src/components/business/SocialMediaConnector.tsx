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
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverColor: 'hover:from-purple-600 hover:to-pink-600',
    description: "We'll only display your public handle and profile link.",
    placeholder: '@username',
    urlTemplate: 'https://instagram.com/'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700',
    description: "We'll only display your public page and profile link.",
    placeholder: 'your.page.name',
    urlTemplate: 'https://facebook.com/'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    description: "We'll only display your public handle and profile link.",
    placeholder: '@username',
    urlTemplate: 'https://tiktok.com/'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
    description: "We'll only display your public handle and profile link.",
    placeholder: '@username',
    urlTemplate: 'https://x.com/'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700',
    description: "We'll only display your public channel and profile link.",
    placeholder: 'channel-name',
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

      const { error } = await supabase
        .from('social_media_connections')
        .upsert({
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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent-glow rounded-full mb-4 shadow-lg">
          <div className="text-3xl">📱</div>
        </div>
        <h3 className="text-3xl font-bold text-accent">Connect Your Socials</h3>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Link your social media accounts to showcase your work and build trust with customers. This step is completely optional.
        </p>
      </div>

      <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-xl p-6 border border-accent/20">
        <div className="grid gap-6 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            const connection = getConnection(platform.id);
            const Icon = platform.icon;

            return (
              <div key={platform.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg w-10 h-10 flex items-center justify-center",
                      platform.color
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{platform.name}</p>
                      <div className="flex items-center gap-2">
                        {connected ? (
                          <Badge variant="secondary" className="text-green-700 bg-green-100 text-xs px-2 py-0.5">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 text-xs px-2 py-0.5">
                            <X className="h-3 w-3 mr-1" />
                            Not connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {connected && connection ? (
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-accent/10"
                              onClick={() => window.open(connection.profile_url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Visit your {platform.name}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDisconnect(connection)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleOAuthConnect(platform)}
                              className={cn(
                                "transition-all duration-200 h-8 px-3 text-xs",
                                platform.color,
                                platform.hoverColor,
                                "text-white border-0"
                              )}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Connect
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualEntry(prev => ({ ...prev, [platform.id]: true }))}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-accent"
                            >
                              Manual
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {platform.description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Connected account details */}
                {connected && connection && (
                  <div className="ml-13 p-3 bg-white/50 rounded-lg border border-accent/10">
                    <p className="text-sm font-medium">@{connection.handle}</p>
                    <p className="text-xs text-muted-foreground">{connection.profile_url}</p>
                  </div>
                )}

                {/* Manual entry form */}
                {showManualEntry[platform.id] && !connected && (
                  <div className="ml-13 space-y-3 p-3 border border-accent/20 rounded-lg bg-white/30">
                    <Label htmlFor={`${platform.id}-handle`} className="text-sm font-medium text-accent">
                      {platform.name} Handle
                    </Label>
                    <Input
                      id={`${platform.id}-handle`}
                      placeholder={platform.placeholder}
                      value={manualEntry[platform.id] || ''}
                      onChange={(e) => setManualEntry(prev => ({ 
                        ...prev, 
                        [platform.id]: e.target.value 
                      }))}
                      className="text-sm h-9"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleManualConnect(platform)}
                        disabled={!manualEntry[platform.id]?.trim()}
                        className="h-8 px-3 text-xs bg-accent hover:bg-accent/90"
                      >
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowManualEntry(prev => ({ 
                          ...prev, 
                          [platform.id]: false 
                        }))}
                        className="h-8 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-accent/20">
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              🛡️ <strong>Privacy:</strong> We only display your public handle and profile link. 
              We never post on your behalf.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          You can always add or remove social accounts later from your dashboard
        </p>
      </div>
    </div>
  );
};