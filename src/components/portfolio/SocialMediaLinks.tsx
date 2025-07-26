import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { 
  Instagram, 
  Facebook, 
  Music, 
  Twitter, 
  Youtube,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  profile_picture_url?: string;
}

interface SocialPlatformConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  hoverColor: string;
}

const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> = {
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
    hoverColor: 'hover:from-purple-600 hover:via-pink-600 hover:to-orange-600'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    hoverColor: 'hover:from-blue-700 hover:to-blue-800'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-gradient-to-r from-black via-gray-900 to-red-600',
    hoverColor: 'hover:from-gray-900 hover:via-black hover:to-red-700'
  },
  twitter: {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-gradient-to-r from-red-600 to-red-700',
    hoverColor: 'hover:from-red-700 hover:to-red-800'
  }
};

interface SocialMediaLinksProps {
  providerId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  providerId,
  className,
  size = 'md',
  showLabels = false
}) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialConnections();
  }, [providerId]);

  const fetchSocialConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true);

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching social connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-5 w-5';
    }
  };

  if (loading) {
    return (
      <div className={cn("flex gap-2", className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-muted animate-pulse",
              getSizeClasses()
            )}
          />
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn("flex gap-3 flex-wrap", className)}>
        {connections.map((connection) => {
          const platform = SOCIAL_PLATFORMS[connection.platform];
          if (!platform) return null;

          const Icon = platform.icon;

          return (
            <Tooltip key={connection.id}>
              <TooltipTrigger asChild>
                <a
                  href={connection.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "group inline-flex items-center justify-center rounded-full text-white transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95",
                    platform.color,
                    platform.hoverColor,
                    getSizeClasses(),
                    "relative overflow-hidden"
                  )}
                  aria-label={`Visit ${platform.name} profile`}
                >
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <Icon className={cn("text-white relative z-10 transition-transform duration-300 group-hover:scale-110", getIconSize())} />
                  
                  {/* Pulse effect on hover */}
                  <div className="absolute inset-0 rounded-full bg-white/30 scale-0 group-hover:scale-100 transition-transform duration-500 opacity-50"></div>
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-white border border-gray-200 shadow-lg">
                <div className="flex items-center gap-2 p-1">
                  <Icon className="h-4 w-4" style={{ color: platform.color.includes('gradient') ? '#6B7280' : undefined }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Follow on {platform.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {connection.handle && (
                      <p className="text-xs text-muted-foreground">
                        @{connection.handle}
                      </p>
                    )}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {showLabels && connections.length > 0 && (
          <div className="flex flex-col justify-center ml-2">
            <div className="flex items-center gap-2">
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-muted-foreground/30 to-transparent"></div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Follow our work
                </p>
                <p className="text-xs text-muted-foreground">
                  Stay updated with our latest projects
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Show connection count for larger displays */}
        {connections.length > 3 && size === 'lg' && (
          <div className={cn(
            "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium transition-colors hover:bg-muted/80",
            getSizeClasses()
          )}>
            <span className="text-sm">+{connections.length - 3}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};