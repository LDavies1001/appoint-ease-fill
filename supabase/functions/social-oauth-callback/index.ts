import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform')
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    
    if (!platform || !code || !state) {
      throw new Error('Missing required parameters')
    }

    // Parse and validate state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (error) {
      throw new Error('Invalid state parameter');
    }

    const { userId, redirectUrl, timestamp, nonce } = stateData;
    
    // Validate state parameters
    if (!userId || !redirectUrl || !timestamp || !nonce) {
      throw new Error('Invalid state data');
    }

    // Check state timestamp (5 minutes max)
    const stateAge = Date.now() - timestamp;
    if (stateAge > 5 * 60 * 1000) {
      throw new Error('OAuth state expired');
    }

    // Validate redirect URL again
    const allowedRedirectUrls = [
      Deno.env.get('SITE_URL'),
      `${Deno.env.get('SITE_URL')}/`,
      `${Deno.env.get('SITE_URL')}/create-business-profile`,
      `${Deno.env.get('SITE_URL')}/dashboard`
    ];
    
    if (!allowedRedirectUrls.some(url => redirectUrl?.startsWith(url || ''))) {
      throw new Error('Invalid redirect URL');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    let userInfo = null

    switch (platform) {
      case 'facebook':
        userInfo = await handleFacebookOAuth(code)
        break
      case 'twitter':
        userInfo = await handleTwitterOAuth(code)
        break
      case 'instagram':
        userInfo = await handleInstagramOAuth(code)
        break
      case 'tiktok':
        userInfo = await handleTikTokOAuth(code)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    if (userInfo) {
      // Save to database
      const { error } = await supabase
        .from('social_media_connections')
        .upsert({
          provider_id: userId,
          platform,
          handle: userInfo.handle,
          profile_url: userInfo.profileUrl,
          profile_picture_url: userInfo.profilePicture,
          is_active: true
        })

      if (error) throw error
    }

    // Redirect back to the app with success
    return Response.redirect(`${redirectUrl}?platform=${platform}&status=success`, 302)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    return Response.redirect(`${Deno.env.get('SITE_URL')}/create-business-profile?error=${encodeURIComponent(error.message)}`, 302)
  }
})

async function handleFacebookOAuth(code: string) {
  const appId = Deno.env.get('FACEBOOK_APP_ID')
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-callback?platform=facebook`

  // Exchange code for access token
  const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `code=${code}`)
  
  const tokenData = await tokenResponse.json()
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get Facebook access token')
  }

  // Get user info
  const userResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,username&access_token=${tokenData.access_token}`)
  const userData = await userResponse.json()
  
  return {
    handle: userData.username || userData.id,
    profileUrl: `https://facebook.com/${userData.username || userData.id}`,
    profilePicture: `https://graph.facebook.com/${userData.id}/picture?type=large`
  }
}

async function handleTwitterOAuth(code: string) {
  const clientId = Deno.env.get('TWITTER_CLIENT_ID')
  const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-callback?platform=twitter`

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: 'challenge' // You'd normally store this
    })
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get Twitter access token')
  }

  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  })
  const userData = await userResponse.json()
  
  return {
    handle: userData.data.username,
    profileUrl: `https://x.com/${userData.data.username}`,
    profilePicture: userData.data.profile_image_url
  }
}

async function handleInstagramOAuth(code: string) {
  const clientId = Deno.env.get('INSTAGRAM_CLIENT_ID')
  const clientSecret = Deno.env.get('INSTAGRAM_CLIENT_SECRET')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-callback?platform=instagram`

  // Exchange code for access token
  const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code
    })
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenData.access_token) {
    throw new Error('Failed to get Instagram access token')
  }

  return {
    handle: tokenData.user.username,
    profileUrl: `https://instagram.com/${tokenData.user.username}`,
    profilePicture: tokenData.user.profile_picture
  }
}

async function handleTikTokOAuth(code: string) {
  const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
  const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/social-oauth-callback?platform=tiktok`

  // Exchange code for access token
  const tokenResponse = await fetch('https://open-api.tiktok.com/oauth/access_token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_key: clientKey!,
      client_secret: clientSecret!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  })

  const tokenData = await tokenResponse.json()
  
  if (!tokenData.data?.access_token) {
    throw new Error('Failed to get TikTok access token')
  }

  // Get user info
  const userResponse = await fetch('https://open-api.tiktok.com/user/info/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.data.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      access_token: tokenData.data.access_token,
      fields: ['open_id', 'union_id', 'avatar_url', 'display_name']
    })
  })

  const userData = await userResponse.json()
  
  return {
    handle: userData.data.display_name,
    profileUrl: `https://tiktok.com/@${userData.data.display_name}`,
    profilePicture: userData.data.avatar_url
  }
}