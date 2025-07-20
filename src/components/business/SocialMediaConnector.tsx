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
    // For now, show manual entry as OAuth requires API keys
    setShowManualEntry(prev => ({ ...prev, [platform.id]: true }));
    toast({
      title: "Manual entry mode",
      description: "OAuth integration coming soon. Please enter your details manually for now."
    });
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Connect Your Socials
          <span className="text-2xl">📱</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to display them on your public profile page.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            const connection = getConnection(platform.id);
            const Icon = platform.icon;

            return (
              <div key={platform.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      platform.color
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <div className="flex items-center gap-2">
                        {connected ? (
                          <Badge variant="secondary" className="text-green-700 bg-green-100">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <X className="h-3 w-3 mr-1" />
                            Not connected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {connected && connection ? (
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(connection.profile_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Visit your {platform.name}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOAuthConnect(platform)}
                            className={cn(
                              "transition-all duration-200",
                              platform.hoverColor
                            )}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
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
                  <div className="ml-11 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">@{connection.handle}</p>
                    <p className="text-xs text-muted-foreground">{connection.profile_url}</p>
                  </div>
                )}

                {/* Manual entry form */}
                {showManualEntry[platform.id] && !connected && (
                  <div className="ml-11 space-y-3 p-3 border rounded-lg">
                    <Label htmlFor={`${platform.id}-handle`} className="text-sm font-medium">
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
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleManualConnect(platform)}
                        disabled={!manualEntry[platform.id]?.trim()}
                      >
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowManualEntry(prev => ({ 
                          ...prev, 
                          [platform.id]: false 
                        }))}
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

        <Separator />

        <div className="text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            🛡️ <strong>Privacy:</strong> We only display your public handle and profile link. 
            We never post on your behalf.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};