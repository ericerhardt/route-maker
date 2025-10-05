import { Router } from 'express'
import { supabaseAdmin, requireAuth, AuthRequest } from '../middleware/auth'
import { getGeocoder } from '../lib/geocoding'

const router = Router()

// Type definition for location
interface Location {
  id?: string
  organization_id: string
  name: string
  type: 'residential' | 'commercial'
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude?: number
  longitude?: number
  notes?: string
  is_active: boolean
}

// Helper to build full address string
function buildAddressString(location: Partial<Location>): string {
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

// Helper to verify organization membership
async function verifyOrgMembership(userId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  return !!data
}

// GET /api/locations/organization/:organizationId - List all locations for an organization
router.get('/organization/:organizationId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { organizationId } = req.params

    // Verify user is member
    if (!await verifyOrgMembership(req.user!.id, organizationId)) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// GET /api/locations/:id - Get single location
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Verify user has access to this organization
    if (!await verifyOrgMembership(req.user!.id, data.organization_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// POST /api/locations - Create new location
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const locationData: Location = req.body

    // Validate required fields
    if (!locationData.organization_id || !locationData.name || !locationData.type ||
        !locationData.address_line1 || !locationData.city || !locationData.state ||
        !locationData.postal_code) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Verify user is member of the organization
    if (!await verifyOrgMembership(req.user!.id, locationData.organization_id)) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert([locationData])
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    next(error)
  }
})

// PUT /api/locations/:id - Update location
router.put('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params
    const locationData: Partial<Location> = req.body

    // Get existing location to verify organization access
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Verify user has access
    if (!await verifyOrgMembership(req.user!.id, existing.organization_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Prevent changing organization_id
    delete locationData.organization_id

    const { data, error } = await supabaseAdmin
      .from('locations')
      .update(locationData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    next(error)
  }
})

// DELETE /api/locations/:id - Delete location
router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Get location to verify organization access
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('organization_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Verify user has access
    if (!await verifyOrgMembership(req.user!.id, existing.organization_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const { error } = await supabaseAdmin
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

// POST /api/locations/:id/geocode - Update GPS for single location
router.post('/:id/geocode', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params

    // Get location
    const { data: location, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Verify user has access
    if (!await verifyOrgMembership(req.user!.id, location.organization_id)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Build address and geocode
    const address = buildAddressString(location)
    const geocoder = await getGeocoder()
    const coords = await geocoder.geocode(address)

    if (!coords) {
      return res.status(400).json({ error: 'Could not geocode address' })
    }

    // Update location with coordinates
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('locations')
      .update({
        latitude: coords.lat,
        longitude: coords.lng
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    res.json(updated)
  } catch (error) {
    next(error)
  }
})

// POST /api/locations/geocode-bulk - Update GPS for multiple locations
router.post('/geocode-bulk', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { ids }: { ids: string[] } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' })
    }

    // Get all locations
    const { data: locations, error: fetchError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .in('id', ids)

    if (fetchError) throw fetchError

    // Verify user has access to all locations
    const uniqueOrgIds = [...new Set(locations?.map(l => l.organization_id) || [])]
    for (const orgId of uniqueOrgIds) {
      if (!await verifyOrgMembership(req.user!.id, orgId)) {
        return res.status(403).json({ error: 'Access denied to one or more locations' })
      }
    }

    const geocoder = await getGeocoder()
    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: string; error: string }>
    }

    // Process each location
    for (const location of locations || []) {
      try {
        const address = buildAddressString(location)
        const coords = await geocoder.geocode(address)

        if (coords) {
          await supabaseAdmin
            .from('locations')
            .update({
              latitude: coords.lat,
              longitude: coords.lng
            })
            .eq('id', location.id)

          results.success++
        } else {
          results.failed++
          results.errors.push({
            id: location.id,
            error: 'Could not geocode address'
          })
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          id: location.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    res.json(results)
  } catch (error) {
    next(error)
  }
})

// POST /api/locations/import - Import locations from CSV
router.post('/import', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { locations, organizationId }: { locations: Location[], organizationId: string } = req.body

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'locations array is required' })
    }

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' })
    }

    // Verify user is member of the organization
    if (!await verifyOrgMembership(req.user!.id, organizationId)) {
      return res.status(403).json({ error: 'Not a member of this organization' })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data?: Partial<Location> }>
    }

    // Validate and insert each location
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i]

      // Validate required fields
      if (!location.name || !location.type || !location.address_line1 ||
          !location.city || !location.state || !location.postal_code) {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: 'Missing required fields',
          data: location
        })
        continue
      }

      // Validate type
      if (location.type !== 'residential' && location.type !== 'commercial') {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: 'Invalid type. Must be "residential" or "commercial"',
          data: location
        })
        continue
      }

      try {
        const { error } = await supabaseAdmin
          .from('locations')
          .insert([{
            ...location,
            organization_id: organizationId, // Force the organization ID
            is_active: location.is_active ?? true,
            country: location.country || 'US'
          }])

        if (error) throw error
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: location
        })
      }
    }

    res.json(results)
  } catch (error) {
    next(error)
  }
})

export default router
