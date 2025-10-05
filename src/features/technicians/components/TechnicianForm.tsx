import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { AddressAutocomplete } from '@/features/locations/components/AddressAutocomplete'
import { technicianFormSchema, type TechnicianFormData, type Technician } from '../schema'

// Phone number formatting helper
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, '')

  // Format as (XXX) XXX-XXXX
  if (cleaned.length <= 3) {
    return cleaned
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
  } else {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

const COST_BASIS_OPTIONS = [
  { value: 'hourly', label: 'Hourly', hint: '$/hr' },
  { value: 'salary', label: 'Salary', hint: '$/yr' },
  { value: 'per_stop', label: 'Per Stop', hint: '$/stop' },
  { value: 'other', label: 'Other', hint: 'amount' },
]

interface TechnicianFormProps {
  initialData?: Technician
  onSubmit: (data: TechnicianFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function TechnicianForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: TechnicianFormProps) {
  const form = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: initialData
      ? {
          full_name: initialData.full_name,
          employment_type: initialData.employment_type,
          email: initialData.email || '',
          phone: initialData.phone || '',
          address_line1: initialData.address_line1 || '',
          address_line2: initialData.address_line2 || '',
          city: initialData.city || '',
          state: initialData.state || '',
          postal_code: initialData.postal_code || '',
          cost_basis: initialData.cost_basis,
          cost_amount: initialData.cost_amount,
          color_hex: initialData.color_hex,
          active: initialData.active,
          notes: initialData.notes || '',
        }
      : {
          full_name: '',
          employment_type: 'contractor',
          email: '',
          phone: '',
          address_line1: '',
          address_line2: '',
          city: '',
          state: '',
          postal_code: '',
          cost_basis: 'hourly',
          cost_amount: 0,
          color_hex: '#22C55E',
          active: true,
          notes: '',
        },
  })

  const watchedCostBasis = form.watch('cost_basis')
  const watchedColorHex = form.watch('color_hex')

  const getCostHint = () => {
    const option = COST_BASIS_OPTIONS.find((opt) => opt.value === watchedCostBasis)
    return option?.hint || 'amount'
  }

  const handleSubmit = async (data: TechnicianFormData) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleColorChange = (value: string) => {
    // Sync color picker with hex input
    form.setValue('color_hex', value.toUpperCase())
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          {/* Full Name */}
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Employment Type */}
          <FormField
            control={form.control}
            name="employment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={field.value || ''}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value)
                        field.onChange(formatted)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address</h3>

          {/* Address Line 1 with Autocomplete */}
          <FormField
            control={form.control}
            name="address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl>
                  <AddressAutocomplete
                    value={field.value || ''}
                    onChange={field.onChange}
                    onSelect={(address) => {
                      // Set the street address
                      field.onChange(address.formattedAddress)

                      // Auto-fill city, state, and postal code if available
                      if (address.components) {
                        if (address.components.city) {
                          form.setValue('city', address.components.city)
                        }
                        if (address.components.state) {
                          form.setValue('state', address.components.state)
                        }
                        if (address.components.postalCode) {
                          form.setValue('postal_code', address.components.postalCode)
                        }
                      }
                    }}
                    placeholder="Start typing address..."
                  />
                </FormControl>
                <FormDescription>
                  Start typing to search for addresses
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address Line 2 */}
          <FormField
            control={form.control}
            name="address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apt 4B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City, State, Postal Code */}
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Dallas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.code} - {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="75201" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Cost Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cost Information</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Cost Basis */}
            <FormField
              control={form.control}
              name="cost_basis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Basis *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select basis" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COST_BASIS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Amount */}
            <FormField
              control={form.control}
              name="cost_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Amount ({getCostHint()}) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Map Color */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Map Visualization</h3>

          <FormField
            control={form.control}
            name="color_hex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color *</FormLabel>
                <div className="flex gap-3 items-center">
                  {/* Color Picker */}
                  <div className="relative">
                    <input
                      type="color"
                      value={watchedColorHex}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="h-10 w-20 cursor-pointer rounded border border-input"
                    />
                  </div>

                  {/* Hex Input */}
                  <FormControl className="flex-1">
                    <Input
                      placeholder="#22C55E"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        field.onChange(value)
                      }}
                      className="font-mono"
                    />
                  </FormControl>

                  {/* Color Preview */}
                  <div
                    className="h-10 w-10 rounded border border-input"
                    style={{ backgroundColor: watchedColorHex }}
                  />
                </div>
                <FormDescription>
                  This color will represent the technician on route maps
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4 cursor-pointer"
                />
              </FormControl>
              <FormLabel className="!mt-0 cursor-pointer">Active</FormLabel>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
