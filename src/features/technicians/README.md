# Technicians Module

A full-featured CRUD module for managing technicians (contractors and employees) in the Route Maker application. This module is designed to work seamlessly with the existing multi-tenant organization-based architecture.

## Overview

The Technicians module allows organizations to:
- Manage contractors and employees
- Store contact information (email, phone, address)
- Track cost information (hourly, salary, per-stop, or custom)
- Assign unique colors for route map visualization
- Toggle active/inactive status
- Add notes and track metadata

## Architecture Alignment

### Multi-Tenancy Model

This module **fully respects the existing organization-scoped multi-tenancy** pattern used throughout the Route Maker application:

- **Tenancy Key**: `organization_id uuid` (references `public.organizations(id)`)
- **RLS Policies**: All operations are scoped to organization membership via `public.organization_members`
- **Data Isolation**: Users can only access technicians within their organizations
- **Cascade Deletion**: Technicians are automatically deleted when their organization is removed

### Database Schema

The `public.technicians` table follows the project's established conventions:

```sql
CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Core fields
  full_name text NOT NULL,
  employment_type text NOT NULL CHECK (employment_type IN ('contractor', 'employee')),

  -- Contact information
  email citext,
  phone text,

  -- Address
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,

  -- Cost information
  cost_basis text NOT NULL DEFAULT 'hourly' CHECK (cost_basis IN ('hourly', 'salary', 'per_stop', 'other')),
  cost_amount numeric(10,2) NOT NULL DEFAULT 0.00,

  -- Map visualization
  color_hex text NOT NULL DEFAULT '#22c55e' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),

  -- Status
  active boolean NOT NULL DEFAULT true,
  notes text
);
```

### Row Level Security (RLS)

All RLS policies use the **organization membership pattern**:

```sql
-- SELECT: Users can view technicians in their organizations
CREATE POLICY "Users can select technicians in their organizations"
  ON public.technicians FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Similar patterns for INSERT, UPDATE, DELETE
```

This ensures:
- ✅ Users can only see technicians in organizations they belong to
- ✅ Users can only create technicians for their organizations
- ✅ Data is automatically filtered at the database level
- ✅ No data leakage across organizations

## Directory Structure

```
src/features/technicians/
├── api/
│   └── techniciansClient.ts      # API client with organization context
├── components/
│   ├── TechnicianForm.tsx         # Create/Edit form with color picker
│   ├── TechniciansTable.tsx       # Data table with filters & sorting
│   └── ViewDrawer.tsx             # Detail view drawer
├── pages/
│   └── TechniciansPage.tsx        # Main page with CRUD operations
├── schema.ts                      # Zod schemas and TypeScript types
└── README.md                      # This file
```

## Key Features

### 1. Color-Coded Technicians

Each technician has a **hex color** (`#RRGGBB` format) that will represent them on future route maps:

- **Strict Validation**: Only valid 6-digit hex colors are accepted
- **Visual Picker**: Native HTML5 color picker for easy selection
- **Hex Input**: Manual entry with uppercase normalization
- **Live Preview**: Real-time color swatch display
- **Default**: `#22C55E` (green) if not specified

### 2. Employment Types

- **Contractor**: Independent contractors
- **Employee**: Full-time employees

Displayed with distinct badges in the UI.

### 3. Cost Information

Flexible cost tracking with multiple basis options:

- **Hourly** (`$/hr`) - Hourly rate for contractors/employees
- **Salary** (`$/yr`) - Annual salary for full-time employees
- **Per Stop** (`$/stop`) - Payment per delivery/stop
- **Other** - Custom arrangement

The UI dynamically updates cost hints based on the selected basis.

### 4. Full CRUD Operations

- **List**: Paginated table with search, filters (type, status), and sorting
- **Create**: Full form with all fields and color picker
- **View**: Detailed drawer showing all technician information
- **Update**: Edit any field with pre-filled form
- **Delete**: Confirmation dialog before deletion

## Usage

### Frontend Integration

The module automatically integrates with the existing `OrganizationContext`:

```typescript
import { useOrganization } from '@/contexts/OrganizationContext'
import { techniciansApi } from '@/features/technicians/api/techniciansClient'

// In your component
const { currentOrganization } = useOrganization()

// All API calls automatically scope to the current organization
const result = await techniciansApi.list(currentOrganization.id)
const newTech = await techniciansApi.create(currentOrganization.id, formData)
```

### API Methods

```typescript
// List with filtering and pagination
const result = await techniciansApi.list(orgId, {
  search: 'John',
  employmentType: 'contractor',
  active: true,
  page: 1,
  pageSize: 20,
  sort: { field: 'full_name', dir: 'asc' }
})

// Get single technician
const tech = await techniciansApi.get(id)

// Create
const newTech = await techniciansApi.create(orgId, {
  full_name: 'John Doe',
  employment_type: 'contractor',
  email: 'john@example.com',
  color_hex: '#FF5733',
  cost_basis: 'hourly',
  cost_amount: 45.00,
  active: true
})

// Update
const updated = await techniciansApi.update(id, { cost_amount: 50.00 })

// Delete
await techniciansApi.delete(id)

// Toggle active status
const toggled = await techniciansApi.toggleActive(id, false)

// Get active technicians only (useful for dropdowns)
const active = await techniciansApi.listActive(orgId)

// Get by employment type
const contractors = await techniciansApi.listByType(orgId, 'contractor')
```

### Form Validation

The module uses **Zod** for strict validation:

```typescript
import { technicianFormSchema } from '@/features/technicians/schema'

// Strict hex color validation
color_hex: z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be in #RRGGBB format')
  .transform((val) => val.toUpperCase())

// Email is optional but validated when provided
email: z
  .string()
  .email('Invalid email format')
  .optional()
  .or(z.literal('').transform(() => undefined))

// Cost amount must be non-negative
cost_amount: z.coerce.number().min(0, 'Cost amount must be 0 or greater')
```

## Database Migration

### Running the Migration

The migration file is located at:
```
supabase/migrations/20251005_create_technicians_table.sql
```

**To apply it:**

```bash
# If using local Supabase CLI
supabase db push

# Or run directly in Supabase SQL Editor
# Copy the contents of the migration file and execute
```

### Migration Features

- ✅ Idempotent (safe to run multiple times)
- ✅ Creates table with all constraints
- ✅ Adds indexes for performance
- ✅ Enables RLS with proper policies
- ✅ Creates automatic `updated_at` trigger
- ✅ Grants permissions to authenticated users

### Indexes Created

```sql
-- Primary lookup by organization
CREATE INDEX idx_technicians_organization_id ON public.technicians(organization_id);

-- Search by name
CREATE INDEX idx_technicians_full_name ON public.technicians(full_name);

-- Filter by status
CREATE INDEX idx_technicians_active ON public.technicians(active);

-- Filter by employment type
CREATE INDEX idx_technicians_employment_type ON public.technicians(employment_type);

-- Email lookup (partial index, only where email exists)
CREATE INDEX idx_technicians_email ON public.technicians(email) WHERE email IS NOT NULL;
```

## Navigation & Routes

### Route Added

```typescript
// src/main.tsx
{ path: '/technicians', element: <TechniciansPage /> }
```

### Navigation Link

The "Technicians" link has been added to the main navigation bar:

```tsx
<Button variant="ghost" asChild>
  <Link to="/technicians">
    <Wrench className="mr-2 h-4 w-4" />
    Technicians
  </Link>
</Button>
```

Located between "Locations" and "Team" in the navbar.

## UI Components

### TechnicianForm
- **Purpose**: Create and edit technicians
- **Features**:
  - Organized sections (Basic Info, Contact, Address, Cost, Map Color)
  - Native color picker + hex input (synced)
  - US states dropdown
  - Dynamic cost hint based on basis
  - Real-time validation
- **Props**: `initialData`, `onSubmit`, `onCancel`, `isSubmitting`

### TechniciansTable
- **Purpose**: Display and manage technicians list
- **Features**:
  - Search by name
  - Filter by employment type (all/contractors/employees)
  - Filter by status (all/active/inactive)
  - Sortable columns
  - Pagination
  - Color swatch in name column
  - Inline actions menu (View/Edit/Delete)
- **Props**: `data`, `onView`, `onEdit`, `onDelete`

### ViewDrawer
- **Purpose**: Display technician details
- **Features**:
  - Organized sections with icons
  - Badges for type and status
  - Clickable email/phone (mailto/tel links)
  - Large color preview with hex code
  - Formatted metadata (created/updated dates)
- **Props**: `technician`, `open`, `onOpenChange`

### TechniciansPage
- **Purpose**: Main orchestration page
- **Features**:
  - Loads technicians for current organization
  - Handles all CRUD operations
  - Manages dialog/drawer states
  - Toast notifications for feedback
  - Confirmation dialog for deletions
  - Loading states

## Future Enhancements

This module is designed to support future route optimization features:

1. **Route Assignment**: Assign technicians to specific routes
2. **Map Visualization**: Display technician routes on a map using their assigned colors
3. **Availability Tracking**: Track technician availability/schedule
4. **Performance Metrics**: Track stops per technician, efficiency, etc.
5. **Skills & Certifications**: Tag technicians with skills for smart routing
6. **Route Optimization**: Use cost basis and location for optimal route assignment

## Switching Tenancy Models

If the project ever needs to switch from organization-scoped to owner-scoped tenancy:

1. **Update Migration**: Replace `organization_id` with `owner_id` in the SQL
2. **Update RLS Policies**: Change from membership check to `owner_id = auth.uid()`
3. **Update API Client**: Modify `techniciansClient.ts` to use `auth.user.id` instead of `organization_id`
4. **Update Schema**: Change `organization_id` to `owner_id` in Zod schemas

The codebase is structured to make this transition straightforward if needed.

## Testing Checklist

- ✅ Migration runs successfully
- ✅ Table appears in Supabase dashboard
- ✅ RLS policies are enabled and working
- ✅ Can create technicians within organization
- ✅ Cannot see technicians from other organizations
- ✅ Search, filters, and sorting work correctly
- ✅ Color picker syncs with hex input
- ✅ Form validation prevents invalid data
- ✅ Edit updates existing technician
- ✅ Delete removes technician with confirmation
- ✅ View drawer displays all information correctly
- ✅ Navigation link appears in navbar
- ✅ Route `/technicians` loads the page

## Dependencies

**Required Packages** (already in project):
- `@supabase/supabase-js` - Database client
- `react-hook-form` - Form management
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation
- `@tanstack/react-table` - Data table
- `framer-motion` - Animations
- `sonner` - Toast notifications
- `lucide-react` - Icons

**shadcn/ui Components Used**:
- `button`, `input`, `textarea`
- `form`, `label`, `select`
- `dialog`, `sheet`, `alert-dialog`
- `dropdown-menu`, `badge`
- `toaster`

## Support

For questions or issues related to this module:
1. Check this README for architecture details
2. Review the migration file for database schema
3. Inspect the Zod schemas for validation rules
4. Check RLS policies in Supabase dashboard
5. Review the API client for integration patterns

---

**Built with**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Supabase + Multi-Tenant Architecture
