import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event_type, user_id, details, ip_address, user_agent } = await req.json();

    // Log security event
    const { error: logError } = await supabase
      .from('security_audit_log')
      .insert({
        user_id,
        event_type,
        event_details: details || {},
        ip_address,
        user_agent
      });

    if (logError) {
      console.error('Failed to log security event:', logError);
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      'failed_login_attempt',
      'unauthorized_access',
      'file_upload_violation',
      'rate_limit_exceeded'
    ];

    if (suspiciousPatterns.includes(event_type)) {
      // Check for multiple failed attempts from same IP/user
      const { data: recentEvents, error: checkError } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('event_type', event_type)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
        .or(`ip_address.eq.${ip_address},user_id.eq.${user_id}`)
        .order('created_at', { ascending: false });

      if (!checkError && recentEvents && recentEvents.length >= 5) {
        // Log high-risk security alert
        await supabase
          .from('security_audit_log')
          .insert({
            user_id,
            event_type: 'high_risk_alert',
            event_details: {
              original_event: event_type,
              attempt_count: recentEvents.length,
              pattern: 'multiple_suspicious_attempts'
            },
            ip_address,
            user_agent
          });

        // In a real application, you might want to:
        // - Send email alerts to administrators
        // - Temporarily block IP address
        // - Trigger additional security measures
        console.warn(`High-risk security alert: ${recentEvents.length} ${event_type} events from ${ip_address || user_id}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in security-monitor function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process security event' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});