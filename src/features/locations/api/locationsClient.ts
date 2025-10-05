import { supabase } from '@/lib/supabaseClient'
import type { Location, LocationFormData, CsvLocation } from '../schema'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const locationsApi = {
  async list(organizationId: string): Promise<Location[]> {
    return fetchWithAuth(`${API_BASE}/api/locations/organization/${organizationId}`)
  },

  async get(id: string): Promise<Location> {
    return fetchWithAuth(`${API_BASE}/api/locations/${id}`)
  },

  async create(organizationId: string, data: LocationFormData): Promise<Location> {
    return fetchWithAuth(`${API_BASE}/api/locations`, {
      method: 'POST',
      body: JSON.stringify({ ...data, organization_id: organizationId }),
    })
  },

  async update(id: string, data: Partial<LocationFormData>): Promise<Location> {
    return fetchWithAuth(`${API_BASE}/api/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<void> {
    return fetchWithAuth(`${API_BASE}/api/locations/${id}`, {
      method: 'DELETE',
    })
  },

  async geocode(id: string): Promise<Location> {
    return fetchWithAuth(`${API_BASE}/api/locations/${id}/geocode`, {
      method: 'POST',
    })
  },

  async geocodeBulk(ids: string[]): Promise<GeocodeResult> {
    return fetchWithAuth(`${API_BASE}/api/locations/geocode-bulk`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  },

  async import(organizationId: string, locations: CsvLocation[]): Promise<ImportResult> {
    return fetchWithAuth(`${API_BASE}/api/locations/import`, {
      method: 'POST',
      body: JSON.stringify({ organizationId, locations }),
    })
  },
}
