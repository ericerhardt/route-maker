import { z } from 'zod'

export const locationSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['residential', 'commercial'], {
    required_error: 'Type is required',
  }),
  address_line1: z.string().min(1, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().default('US'),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

export type Location = z.infer<typeof locationSchema>

export const locationFormSchema = locationSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
})

export type LocationFormData = z.infer<typeof locationFormSchema>

// CSV Import schema
export const csvLocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['residential', 'commercial']),
  address_line1: z.string().min(1),
  address_line2: z.string().optional().default(''),
  city: z.string().min(1),
  state: z.string().min(2),
  postal_code: z.string().min(1),
  country: z.string().optional().default('US'),
  notes: z.string().optional().default(''),
})

export type CsvLocation = z.infer<typeof csvLocationSchema>
