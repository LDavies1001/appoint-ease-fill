import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationData {
  id: string;
  notification_type: string;
  channel: string;
  status: string;
  content: any;
  booking_id?: string;
  created_at: string;
  sent_at?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user's notification history
  const loadNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        toast({
          title: "Error loading notifications",
          description: "Could not load your notification history",
          variant: "destructive"
        });
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show booking-related toasts
  const showBookingToast = (type: string, bookingData: any) => {
    const isProvider = bookingData.provider_id === user?.id;
    
    switch (type) {
      case 'booking_confirmation':
        toast({
          title: "Booking confirmed! ✅",
          description: `Your appointment is scheduled for ${new Date(bookingData.booking_date).toLocaleDateString()} at ${bookingData.start_time}`,
        });
        break;
        
      case 'new_booking_received':
        if (isProvider) {
          toast({
            title: "New booking received! 🎉",
            description: `You have a new appointment on ${new Date(bookingData.booking_date).toLocaleDateString()}`,
          });
        }
        break;
        
      case 'booking_cancelled':
        toast({
          title: "Booking cancelled",
          description: `Your appointment for ${new Date(bookingData.booking_date).toLocaleDateString()} has been cancelled`,
          variant: "destructive"
        });
        break;
        
      case 'booking_confirmed':
        toast({
          title: "Booking confirmed! ✅",
          description: `Your appointment has been confirmed by the provider`,
        });
        break;
        
      default:
        break;
    }
  };

  // Show profile update toasts
  const showProfileToast = (type: string, message?: string) => {
    switch (type) {
      case 'profile_updated':
        toast({
          title: "Profile updated! ✅",
          description: message || "Your profile has been successfully updated",
        });
        break;
        
      case 'image_uploaded':
        toast({
          title: "Image uploaded! 📸",
          description: message || "Your image has been uploaded successfully",
        });
        break;
        
      case 'image_upload_failed':
        toast({
          title: "Upload failed",
          description: message || "Could not upload image. Please try again.",
          variant: "destructive"
        });
        break;
        
      case 'service_added':
        toast({
          title: "Service added! ✨",
          description: message || "Your new service has been added",
        });
        break;
        
      case 'service_updated':
        toast({
          title: "Service updated! ✅",
          description: message || "Your service has been updated",
        });
        break;
        
      case 'portfolio_updated':
        toast({
          title: "Portfolio updated! 🎨",
          description: message || "Your portfolio has been updated",
        });
        break;
        
      default:
        break;
    }
  };

  // Show error toasts
  const showErrorToast = (message: string, description?: string) => {
    toast({
      title: message,
      description: description || "Please try again or contact support if the problem persists.",
      variant: "destructive"
    });
  };

  // Show success toasts
  const showSuccessToast = (message: string, description?: string) => {
    toast({
      title: message,
      description: description,
    });
  };

  // Process pending notifications (trigger email sending)
  const processPendingNotifications = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-pending-notifications');
      
      if (error) {
        console.error('Error processing notifications:', error);
      }
    } catch (error) {
      console.error('Error invoking notification processor:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  return {
    notifications,
    loading,
    loadNotifications,
    showBookingToast,
    showProfileToast,
    showErrorToast,
    showSuccessToast,
    processPendingNotifications
  };
};