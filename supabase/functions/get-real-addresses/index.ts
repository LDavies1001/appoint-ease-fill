import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { postcode } = await req.json()
    
    if (!postcode) {
      return new Response(
        JSON.stringify({ error: 'Postcode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the Perplexity API key from environment variables
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')
    
    if (!perplexityApiKey) {
      return new Response(
        JSON.stringify({ error: 'Perplexity API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use Perplexity to find real addresses in this postcode
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an address lookup service. Return ONLY a valid JSON array of real addresses. Each address should have: house_number, street_name, area, city, county. Return actual real addresses that exist in the given UK postcode area. Limit to 15 addresses maximum.'
          },
          {
            role: 'user',
            content: `Find real street addresses in UK postcode ${postcode}. Return as JSON array with format: [{"house_number":"123","street_name":"Oxford Road","area":"Northern Moor","city":"Manchester","county":"Greater Manchester"}]`
          }
        ],
        temperature: 0.1,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content received from Perplexity API')
    }

    // Try to parse the JSON response
    let addresses
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        addresses = JSON.parse(jsonMatch[0])
      } else {
        addresses = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse addresses:', content)
      // Fallback: return empty array if parsing fails
      addresses = []
    }

    // Validate and format addresses
    const formattedAddresses = addresses
      .filter((addr: any) => addr.house_number && addr.street_name)
      .map((addr: any) => ({
        house_number: addr.house_number.toString(),
        street: addr.street_name,
        suburb: addr.area || '',
        city: addr.city || 'Manchester',
        county: addr.county || 'Greater Manchester',
        postcode: postcode.toUpperCase(),
        country: 'United Kingdom',
        town_city: addr.area && addr.area !== addr.city ? `${addr.area}, ${addr.city}` : addr.city || 'Manchester',
        displayName: `${addr.house_number} ${addr.street_name}, ${addr.area || addr.city || 'Manchester'}, ${postcode.toUpperCase()}`,
        isReal: true
      }))
      .sort((a: any, b: any) => {
        const aNum = parseInt(a.house_number) || 999
        const bNum = parseInt(b.house_number) || 999
        return aNum - bNum
      })

    return new Response(
      JSON.stringify({ addresses: formattedAddresses }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-real-addresses function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})