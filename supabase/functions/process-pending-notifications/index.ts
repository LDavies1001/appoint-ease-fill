import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending notifications
    const { data: pendingNotifications, error } = await supabase
      .from('notifications_log')
      .select('id, channel, notification_type')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10); // Process in batches

    if (error) {
      console.error('Error fetching pending notifications:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications to process" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const results = [];

    for (const notification of pendingNotifications) {
      try {
        if (notification.channel === 'email') {
          // Call email notification function
          const emailResponse = await supabase.functions.invoke('send-booking-notifications', {
            body: { notification_id: notification.id }
          });

          if (emailResponse.error) {
            console.error(`Failed to process email notification ${notification.id}:`, emailResponse.error);
            results.push({ 
              id: notification.id, 
              status: 'failed', 
              error: emailResponse.error.message 
            });
          } else {
            results.push({ 
              id: notification.id, 
              status: 'processed' 
            });
          }
        } else if (notification.channel === 'sms') {
          // SMS processing would go here
          // For now, mark as not implemented
          await supabase
            .from('notifications_log')
            .update({ 
              status: 'failed',
              error_message: 'SMS notifications not yet implemented'
            })
            .eq('id', notification.id);
          
          results.push({ 
            id: notification.id, 
            status: 'not_implemented',
            error: 'SMS notifications not yet implemented'
          });
        }
      } catch (error: any) {
        console.error(`Error processing notification ${notification.id}:`, error);
        results.push({ 
          id: notification.id, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    console.log(`Processed ${results.length} notifications`);

    return new Response(
      JSON.stringify({ 
        processed: results.length,
        results: results
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in process-pending-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);