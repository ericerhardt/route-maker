import { supabase } from '@/lib/supabaseClient'
import type { Technician, TechnicianFormData, TechnicianUpdateData } from '../schema'

export interface TechnicianListOptions {
  search?: string
  employmentType?: 'contractor' | 'employee' | 'all'
  active?: boolean | 'all'
  page?: number
  pageSize?: number
  sort?: { field: keyof Technician; dir: 'asc' | 'desc' }
}

export interface TechnicianListResult {
  data: Technician[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export const techniciansApi = {
  /**
   * List technicians with filtering, sorting, and pagination
   */
  async list(
    organizationId: string,
    options: TechnicianListOptions = {}
  ): Promise<TechnicianListResult> {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20

    // Start building the query
    let query = supabase
      .from('technicians')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)

    // Apply search filter (searches full_name)
    if (options.search && options.search.trim()) {
      query = query.ilike('full_name', `%${options.search.trim()}%`)
    }

    // Apply employment type filter
    if (options.employmentType && options.employmentType !== 'all') {
      query = query.eq('employment_type', options.employmentType)
    }

    // Apply active status filter
    if (options.active !== undefined && options.active !== 'all') {
      query = query.eq('active', options.active)
    }

    // Apply sorting
    if (options.sort) {
      query = query.order(options.sort.field, { ascending: options.sort.dir === 'asc' })
    } else {
      // Default sort: most recently updated first
      query = query.order('updated_at', { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    const totalPages = count ? Math.ceil(count / pageSize) : 0

    return {
      data: data || [],
      count: count ?? 0,
      page,
      pageSize,
      totalPages,
    }
  },

  /**
   * Get a single technician by ID
   */
  async get(id: string): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Create a new technician
   */
  async create(organizationId: string, formData: TechnicianFormData): Promise<Technician> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('technicians')
      .insert([
        {
          ...formData,
          organization_id: organizationId,
          created_by: user?.id,
        },
      ])
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Update an existing technician
   */
  async update(id: string, formData: TechnicianUpdateData): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .update(formData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Delete a technician
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('technicians').delete().eq('id', id)

    if (error) throw new Error(error.message)
  },

  /**
   * Toggle technician active status
   */
  async toggleActive(id: string, active: boolean): Promise<Technician> {
    const { data, error } = await supabase
      .from('technicians')
      .update({ active })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Get all active technicians (useful for dropdowns/selectors)
   */
  async listActive(organizationId: string): Promise<Technician[]> {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Get technicians by employment type
   */
  async listByType(
    organizationId: string,
    employmentType: 'contractor' | 'employee'
  ): Promise<Technician[]> {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('employment_type', employmentType)
      .eq('active', true)
      .order('full_name', { ascending: true })

    if (error) throw new Error(error.message)
    return data || []
  },
}
