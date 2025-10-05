-- Create technicians table with organization-scoped multi-tenancy
-- Follows the project's established pattern with organization_id FK

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";

-- Create technicians table
CREATE TABLE IF NOT EXISTS public.technicians (
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

  -- Address fields
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,

  -- Cost information
  cost_basis text NOT NULL DEFAULT 'hourly' CHECK (cost_basis IN ('hourly', 'salary', 'per_stop', 'other')),
  cost_amount numeric(10,2) NOT NULL DEFAULT 0.00,

  -- Map visualization color (strict hex format)
  color_hex text NOT NULL DEFAULT '#22c55e' CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),

  -- Status and notes
  active boolean NOT NULL DEFAULT true,
  notes text
);

-- Add comment for table documentation
COMMENT ON TABLE public.technicians IS 'Technicians (contractors and employees) with cost info and map color for route visualization';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_technicians_organization_id ON public.technicians(organization_id);
CREATE INDEX IF NOT EXISTS idx_technicians_full_name ON public.technicians(full_name);
CREATE INDEX IF NOT EXISTS idx_technicians_active ON public.technicians(active);
CREATE INDEX IF NOT EXISTS idx_technicians_employment_type ON public.technicians(employment_type);
CREATE INDEX IF NOT EXISTS idx_technicians_email ON public.technicians(email) WHERE email IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SELECT - users can view technicians in their organizations
DROP POLICY IF EXISTS "Users can select technicians in their organizations" ON public.technicians;
CREATE POLICY "Users can select technicians in their organizations"
  ON public.technicians FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: INSERT - users can create technicians in their organizations
DROP POLICY IF EXISTS "Users can insert technicians in their organizations" ON public.technicians;
CREATE POLICY "Users can insert technicians in their organizations"
  ON public.technicians FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: UPDATE - users can update technicians in their organizations
DROP POLICY IF EXISTS "Users can update technicians in their organizations" ON public.technicians;
CREATE POLICY "Users can update technicians in their organizations"
  ON public.technicians FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: DELETE - users can delete technicians in their organizations
DROP POLICY IF EXISTS "Users can delete technicians in their organizations" ON public.technicians;
CREATE POLICY "Users can delete technicians in their organizations"
  ON public.technicians FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for automatic updated_at timestamp
-- Note: update_updated_at_column() function already exists in the schema
DROP TRIGGER IF EXISTS set_updated_at ON public.technicians;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.technicians
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO authenticated;
