import { z } from 'zod'

// Strict hex color validation (#RRGGBB format only)
export const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

export const technicianSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_by: z.string().uuid().optional().nullable(),

  // Core fields
  full_name: z.string().min(2, 'Full name is required (minimum 2 characters)'),
  employment_type: z.enum(['contractor', 'employee'], {
    required_error: 'Employment type is required',
  }),

  // Contact information
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  phone: z.string().optional().or(z.literal('').transform(() => undefined)),

  // Address fields
  address_line1: z.string().optional().or(z.literal('').transform(() => undefined)),
  address_line2: z.string().optional().or(z.literal('').transform(() => undefined)),
  city: z.string().optional().or(z.literal('').transform(() => undefined)),
  state: z.string().optional().or(z.literal('').transform(() => undefined)),
  postal_code: z.string().optional().or(z.literal('').transform(() => undefined)),

  // Cost information
  cost_basis: z
    .enum(['hourly', 'salary', 'per_stop', 'other'], {
      required_error: 'Cost basis is required',
    })
    .default('hourly'),
  cost_amount: z.coerce.number().min(0, 'Cost amount must be 0 or greater').default(0),

  // Map visualization color (strict hex format)
  color_hex: z
    .string()
    .regex(hexColorRegex, 'Color must be in #RRGGBB format (e.g., #22C55E)')
    .transform((val) => val.toUpperCase())
    .default('#22C55E'),

  // Status and notes
  active: z.boolean().default(true),
  notes: z.string().optional().or(z.literal('').transform(() => undefined)),
})

export type Technician = z.infer<typeof technicianSchema>

// Form schema omits auto-generated and organization fields
export const technicianFormSchema = technicianSchema.omit({
  id: true,
  organization_id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
})

export type TechnicianFormData = z.infer<typeof technicianFormSchema>

// Update schema for editing (all fields optional except constraints)
export const technicianUpdateSchema = technicianFormSchema.partial()

export type TechnicianUpdateData = z.infer<typeof technicianUpdateSchema>
