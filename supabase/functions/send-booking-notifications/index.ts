import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationData {
  user_id: string;
  notification_type: string;
  content: any;
  booking_id?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!resend) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { notification_id } = await req.json();

    // Get notification details from database
    const { data: notification, error: notificationError } = await supabase
      .from('notifications_log')
      .select(`
        *,
        user:profiles!user_id(name, email, active_role, notification_preferences),
        booking:bookings(
          booking_date,
          start_time,
          end_time,
          status,
          price,
          provider:profiles!provider_id(name, business_name),
          customer:profiles!customer_id(name),
          service:services(name)
        )
      `)
      .eq('id', notification_id)
      .eq('status', 'pending')
      .single();

    if (notificationError || !notification) {
      console.error('Notification not found:', notificationError);
      return new Response(
        JSON.stringify({ error: "Notification not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check user notification preferences
    const userPrefs = notification.user?.notification_preferences || {};
    const isCustomer = notification.user?.active_role === 'customer';
    
    if (!userPrefs.email_notifications) {
      // Mark as skipped
      await supabase
        .from('notifications_log')
        .update({ 
          status: 'skipped',
          error_message: 'User has disabled email notifications'
        })
        .eq('id', notification_id);

      return new Response(
        JSON.stringify({ message: "User has disabled email notifications" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email content based on notification type
    const emailContent = generateEmailContent(notification);
    
    if (!emailContent) {
      await supabase
        .from('notifications_log')
        .update({ 
          status: 'failed',
          error_message: 'Unknown notification type'
        })
        .eq('id', notification_id);

      return new Response(
        JSON.stringify({ error: "Unknown notification type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "OpenSlot <bookings@resend.dev>",
      to: [notification.user.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      
      await supabase
        .from('notifications_log')
        .update({ 
          status: 'failed',
          error_message: emailResponse.error.message,
          sent_at: new Date().toISOString()
        })
        .eq('id', notification_id);

      return new Response(
        JSON.stringify({ error: emailResponse.error }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark notification as sent
    await supabase
      .from('notifications_log')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', notification_id);

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.data?.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-booking-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function generateEmailContent(notification: any) {
  const { notification_type, content, user, booking } = notification;
  const isCustomer = user?.active_role === 'customer';
  const brandColor = isCustomer ? '#F2C2C2' : '#C5D9C5'; // Pink for customers, sage for providers
  
  const baseStyles = `
    <style>
      .email-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; }
      .header { background: ${brandColor}; padding: 20px; text-align: center; }
      .content { padding: 20px; background: white; }
      .booking-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
      .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
      .button { background: ${brandColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
    </style>
  `;

  switch (notification_type) {
    case 'booking_confirmation':
      return {
        subject: `Booking Confirmation - ${booking?.service?.name || 'Service'}`,
        html: `
          ${baseStyles}
          <div class="email-container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || 'Customer'},</p>
              <p>Your booking has been confirmed! Here are the details:</p>
              
              <div class="booking-details">
                <strong>Service:</strong> ${booking?.service?.name || 'Service'}<br>
                <strong>Provider:</strong> ${booking?.provider?.business_name || booking?.provider?.name}<br>
                <strong>Date:</strong> ${new Date(booking?.booking_date).toLocaleDateString()}<br>
                <strong>Time:</strong> ${booking?.start_time} - ${booking?.end_time}<br>
                <strong>Price:</strong> £${booking?.price || 'N/A'}
              </div>
              
              <p>We'll send you a reminder 24 hours before your appointment.</p>
              <p>Looking forward to seeing you!</p>
            </div>
            <div class="footer">
              <p>OpenSlot - Making appointments simple</p>
            </div>
          </div>
        `
      };

    case 'new_booking_received':
      return {
        subject: `New Booking Received - ${booking?.service?.name || 'Service'}`,
        html: `
          ${baseStyles}
          <div class="email-container">
            <div class="header">
              <h1>New Booking!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || user.business_name || 'Provider'},</p>
              <p>You have a new booking request:</p>
              
              <div class="booking-details">
                <strong>Service:</strong> ${booking?.service?.name || 'Service'}<br>
                <strong>Customer:</strong> ${booking?.customer?.name}<br>
                <strong>Date:</strong> ${new Date(booking?.booking_date).toLocaleDateString()}<br>
                <strong>Time:</strong> ${booking?.start_time} - ${booking?.end_time}<br>
                <strong>Price:</strong> £${booking?.price || 'N/A'}
              </div>
              
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/dashboard" class="button">
                View in Dashboard
              </a>
              
              <p>Please confirm or update the booking status in your dashboard.</p>
            </div>
            <div class="footer">
              <p>OpenSlot - Growing your business, one booking at a time</p>
            </div>
          </div>
        `
      };

    case 'booking_cancelled':
      return {
        subject: `Booking Cancelled - ${booking?.service?.name || 'Service'}`,
        html: `
          ${baseStyles}
          <div class="email-container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || 'Customer'},</p>
              <p>Your booking has been cancelled:</p>
              
              <div class="booking-details">
                <strong>Service:</strong> ${booking?.service?.name || 'Service'}<br>
                <strong>Date:</strong> ${new Date(booking?.booking_date).toLocaleDateString()}<br>
                <strong>Time:</strong> ${booking?.start_time} - ${booking?.end_time}
              </div>
              
              <p>If you'd like to reschedule, please visit our website to book a new appointment.</p>
            </div>
            <div class="footer">
              <p>OpenSlot - We're here when you're ready</p>
            </div>
          </div>
        `
      };

    default:
      return null;
  }
}

serve(handler);