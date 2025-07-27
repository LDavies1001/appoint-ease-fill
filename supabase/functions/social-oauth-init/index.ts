import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { platform, userId, redirectUrl } = await req.json()
    
    if (!platform || !userId) {
      throw new Error('Platform and userId are required')
    }

    // Validate platform
    const allowedPlatforms = ['facebook', 'twitter', 'instagram', 'tiktok'];
    if (!allowedPlatforms.includes(platform)) {
      throw new Error('Invalid platform');
    }

    // Validate and whitelist redirect URL
    const allowedRedirectUrls = [
      Deno.env.get('SITE_URL'),
      `${Deno.env.get('SITE_URL')}/`,
      `${Deno.env.get('SITE_URL')}/create-business-profile`,
      `${Deno.env.get('SITE_URL')}/dashboard`
    ];
    
    const finalRedirectUrl = redirectUrl || Deno.env.get('SITE_URL');
    if (!allowedRedirectUrls.some(url => finalRedirectUrl?.startsWith(url || ''))) {
      throw new Error('Invalid redirect URL');
    }

    // Add timestamp for state validation
    const stateData = {
      userId,
      redirectUrl: finalRedirectUrl,
      timestamp: Date.now(),
      nonce: crypto.randomUUID()
    };

    const state = btoa(JSON.stringify(stateData));
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-callback?platform=${platform}`
    
    let authUrl = ''

    switch (platform) {
      case 'facebook':
        const facebookAppId = Deno.env.get('FACEBOOK_APP_ID')
        authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
          `client_id=${facebookAppId}&` +
          `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
          `scope=public_profile&` +
          `state=${state}&` +
          `response_type=code`
        break

      case 'twitter':
        const twitterClientId = Deno.env.get('TWITTER_CLIENT_ID')
        authUrl = `https://twitter.com/i/oauth2/authorize?` +
          `response_type=code&` +
          `client_id=${twitterClientId}&` +
          `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
          `scope=tweet.read%20users.read&` +
          `state=${state}&` +
          `code_challenge=challenge&` +
          `code_challenge_method=plain`
        break

      case 'instagram':
        const instagramClientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
        authUrl = `https://api.instagram.com/oauth/authorize?` +
          `client_id=${instagramClientId}&` +
          `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
          `scope=user_profile&` +
          `response_type=code&` +
          `state=${state}`
        break

      case 'tiktok':
        const tiktokClientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
        authUrl = `https://www.tiktok.com/auth/authorize/?` +
          `client_key=${tiktokClientKey}&` +
          `scope=user.info.basic&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
          `state=${state}`
        break

      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('OAuth init error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})