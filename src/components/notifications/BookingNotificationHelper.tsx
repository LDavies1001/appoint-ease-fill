import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BookingNotificationHelperProps {
  children: React.ReactNode;
}

/**
 * This component handles real-time booking notifications and automatically
 * triggers toast notifications and email processing when bookings change.
 */
const BookingNotificationHelper: React.FC<BookingNotificationHelperProps> = ({ children }) => {
  const { showBookingToast, processPendingNotifications } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to booking changes for real-time notifications
    const bookingsChannel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Booking change detected (customer):', payload);
          
          if (payload.eventType === 'INSERT') {
            showBookingToast('booking_confirmation', payload.new);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'confirmed') {
              showBookingToast('booking_confirmed', payload.new);
            } else if (payload.new.status === 'cancelled') {
              showBookingToast('booking_cancelled', payload.new);
            }
          }
          
          // Trigger email processing
          processPendingNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Booking change detected (provider):', payload);
          
          if (payload.eventType === 'INSERT') {
            showBookingToast('new_booking_received', payload.new);
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status === 'cancelled') {
              showBookingToast('booking_cancelled', payload.new);
            }
          }
          
          // Trigger email processing
          processPendingNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
    };
  }, [user, showBookingToast, processPendingNotifications]);

  return <>{children}</>;
};

export default BookingNotificationHelper;