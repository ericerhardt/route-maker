import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  locationId?: string
  locationIds?: string[]
  address?: string
}

interface GeocodeResult {
  lat: number
  lng: number
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const provider = Deno.env.get('GEOCODING_PROVIDER') || 'opencage'
  const apiKey = Deno.env.get('GEOCODING_API_KEY')

  if (!apiKey) {
    throw new Error('GEOCODING_API_KEY not configured')
  }

  if (provider === 'opencage') {
    const params = new URLSearchParams({
      q: address,
      key: apiKey,
      limit: '1',
      no_annotations: '1',
    })

    const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?${params}`)
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry
      return { lat, lng }
    }
  } else if (provider === 'google') {
    const params = new URLSearchParams({
      address,
      key: apiKey,
    })

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`)
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      return { lat, lng }
    }
  }

  return null
}

function buildAddressString(location: any): string {
  const parts = [
    location.address_line1,
    location.address_line2,
    location.city,
    location.state,
    location.postal_code,
    location.country,
  ].filter(Boolean)
  return parts.join(', ')
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const body: GeocodeRequest = await req.json()

    // Single location geocoding
    if (body.locationId) {
      const { data: location, error } = await supabaseClient
        .from('locations')
        .select('*')
        .eq('id', body.locationId)
        .single()

      if (error || !location) {
        throw new Error('Location not found')
      }

      const address = buildAddressString(location)
      const coords = await geocodeAddress(address)

      if (!coords) {
        throw new Error('Could not geocode address')
      }

      const { data: updated, error: updateError } = await supabaseClient
        .from('locations')
        .update({
          latitude: coords.lat,
          longitude: coords.lng,
        })
        .eq('id', body.locationId)
        .select()
        .single()

      if (updateError) throw updateError

      return new Response(
        JSON.stringify(updated),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bulk geocoding
    if (body.locationIds && body.locationIds.length > 0) {
      const { data: locations, error } = await supabaseClient
        .from('locations')
        .select('*')
        .in('id', body.locationIds)

      if (error) throw error

      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ id: string; error: string }>,
      }

      for (const location of locations || []) {
        try {
          const address = buildAddressString(location)
          const coords = await geocodeAddress(address)

          if (coords) {
            await supabaseClient
              .from('locations')
              .update({
                latitude: coords.lat,
                longitude: coords.lng,
              })
              .eq('id', location.id)

            results.success++
          } else {
            results.failed++
            results.errors.push({
              id: location.id,
              error: 'Could not geocode address',
            })
          }
        } catch (error: any) {
          results.failed++
          results.errors.push({
            id: location.id,
            error: error.message,
          })
        }
      }

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Direct address geocoding (for autocomplete)
    if (body.address) {
      const coords = await geocodeAddress(body.address)

      if (!coords) {
        throw new Error('Could not geocode address')
      }

      return new Response(
        JSON.stringify(coords),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid request: must provide locationId, locationIds, or address')
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
