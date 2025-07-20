import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SocialConnection {
  id: string;
  platform: string;
  handle: string;
  profile_url: string;
  profile_picture_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSocialConnections = (providerId?: string) => {
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConnections = async () => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (error) {
      console.error('Error fetching social connections:', error);
      toast({
        title: "Error loading connections",
        description: "Could not load social media connections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addConnection = async (
    platform: string,
    handle: string,
    profileUrl: string,
    profilePictureUrl?: string
  ) => {
    if (!providerId) throw new Error('Provider ID required');

    try {
      const { data, error } = await supabase
        .from('social_media_connections')
        .upsert({
          provider_id: providerId,
          platform,
          handle,
          profile_url: profileUrl,
          profile_picture_url: profilePictureUrl,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      await fetchConnections();
      return data;
    } catch (error) {
      console.error('Error adding social connection:', error);
      throw error;
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_media_connections')
        .update({ is_active: false })
        .eq('id', connectionId);

      if (error) throw error;
      await fetchConnections();
    } catch (error) {
      console.error('Error removing social connection:', error);
      throw error;
    }
  };

  const isConnected = (platform: string) => {
    return connections.some(conn => conn.platform === platform);
  };

  const getConnection = (platform: string) => {
    return connections.find(conn => conn.platform === platform);
  };

  useEffect(() => {
    fetchConnections();
  }, [providerId]);

  return {
    connections,
    loading,
    addConnection,
    removeConnection,
    isConnected,
    getConnection,
    refetch: fetchConnections
  };
};