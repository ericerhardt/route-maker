import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AddressComponents {
  street?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

interface AutocompleteResult {
  description: string
  placeId?: string
  formattedAddress: string
  components?: AddressComponents
}

function parseOpenCageComponents(components: any): AddressComponents {
  return {
    street: components.road || components.street || '',
    city: components.city || components.town || components.village || '',
    state: components.state_code || components.state || '',
    postalCode: components.postcode || '',
    country: components.country_code?.toUpperCase() || components.country || 'US',
  }
}

async function searchAddresses(query: string): Promise<AutocompleteResult[]> {
  const provider = Deno.env.get('GEOCODING_PROVIDER') || 'opencage'
  const apiKey = Deno.env.get('GEOCODING_API_KEY')

  if (!apiKey) {
    throw new Error('GEOCODING_API_KEY not configured')
  }

  const results: AutocompleteResult[] = []

  if (provider === 'opencage') {
    const params = new URLSearchParams({
      q: query,
      key: apiKey,
      limit: '5',
    })

    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`)
    const data = await response.json()

    if (data.results) {
      for (const result of data.results) {
        const components = parseOpenCageComponents(result.components)

        // Build clean street address (just street number + name)
        const houseNumber = result.components.house_number || ''
        const road = result.components.road || result.components.street || ''
        const street = [houseNumber, road].filter(Boolean).join(' ')

        results.push({
          description: result.formatted,
          formattedAddress: street || result.formatted,
          components,
        })
      }
    }
  } else if (provider === 'google') {
    // Use Google Places Autocomplete
    const params = new URLSearchParams({
      input: query,
      key: apiKey,
      types: 'address',
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
    )
    const data = await response.json()

    if (data.predictions) {
      for (const prediction of data.predictions) {
        results.push({
          description: prediction.description,
          placeId: prediction.place_id,
          formattedAddress: prediction.description,
        })
      }
    }
  }

  return results
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = await searchAddresses(query)

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
