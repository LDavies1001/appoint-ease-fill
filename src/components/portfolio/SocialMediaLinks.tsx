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
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    hoverColor: 'hover:from-purple-600 hover:to-pink-600'
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    hoverColor: 'hover:bg-blue-700'
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: 'bg-black',
    hoverColor: 'hover:bg-gray-800'
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
    color: 'bg-red-600',
    hoverColor: 'hover:bg-red-700'
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
      <div className={cn("flex gap-3", className)}>
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
                    "inline-flex items-center justify-center rounded-full text-white transition-all duration-200 transform hover:scale-110 hover:shadow-lg",
                    platform.color,
                    platform.hoverColor,
                    getSizeClasses()
                  )}
                  aria-label={`Visit ${platform.name} profile`}
                >
                  <Icon className={cn("text-white", getIconSize())} />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <div className="flex items-center gap-2">
                  <span>Visit my {platform.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
                {connection.handle && (
                  <p className="text-xs text-muted-foreground">
                    @{connection.handle}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {showLabels && (
          <div className="flex flex-col justify-center ml-2">
            <p className="text-sm text-muted-foreground">
              Follow us on social media
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};