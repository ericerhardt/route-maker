import { supabase } from '@/lib/supabaseClient'
import type { Location, LocationFormData, CsvLocation } from '../schema'

export interface GeocodeResult {
  success: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string; data?: Partial<CsvLocation> }>
}

export const locationsApi = {
  async list(organizationId: string): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  async get(id: string): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async create(organizationId: string, formData: LocationFormData): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .insert([{
        ...formData,
        organization_id: organizationId,
      }])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, formData: Partial<LocationFormData>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async geocode(id: string): Promise<Location> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('geocode', {
      body: { locationId: id },
    })

    if (error) throw new Error(error.message)
    return data
  },

  async geocodeBulk(ids: string[]): Promise<GeocodeResult> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const { data, error } = await supabase.functions.invoke('geocode', {
      body: { locationIds: ids },
    })

    if (error) throw new Error(error.message)
    return data
  },

  async import(organizationId: string, locations: CsvLocation[]): Promise<ImportResult> {
    const results: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    }

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i]

      try {
        const { error } = await supabase
          .from('locations')
          .insert([{
            ...location,
            organization_id: organizationId,
            is_active: true,
          }])

        if (error) throw error
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: location,
        })
      }
    }

    return results
  },
}
