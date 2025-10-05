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

function parseGoogleComponents(addressComponents: any[]): AddressComponents {
  const result: AddressComponents = {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  }

  let streetNumber = ''
  let route = ''

  for (const component of addressComponents) {
    const types = component.types || []

    if (types.includes('street_number')) {
      streetNumber = component.short_name
    } else if (types.includes('route')) {
      route = component.short_name
    } else if (types.includes('locality')) {
      result.city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name
    } else if (types.includes('postal_code')) {
      result.postalCode = component.short_name
    } else if (types.includes('country')) {
      result.country = component.short_name
    }
  }

  // Build street address from street number + route
  result.street = [streetNumber, route].filter(Boolean).join(' ')

  return result
}

async function getPlaceDetails(placeId: string): Promise<AddressComponents> {
  const apiKey = Deno.env.get('GEOCODING_API_KEY')

  if (!apiKey) {
    throw new Error('GEOCODING_API_KEY not configured')
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: 'address_components',
  })

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`
  )
  const data = await response.json()

  if (data.result && data.result.address_components) {
    return parseGoogleComponents(data.result.address_components)
  }

  throw new Error('Failed to fetch place details')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const placeId = url.searchParams.get('place_id')

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'place_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const components = await getPlaceDetails(placeId)

    return new Response(
      JSON.stringify({ components }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
