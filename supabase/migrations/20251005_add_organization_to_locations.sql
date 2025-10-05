-- Add organization_id to locations table for multi-tenant support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'locations'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.locations
    ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS locations_organization_id_idx ON public.locations(organization_id);

-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can select locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can update locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated users can delete locations" ON public.locations;

-- Create new organization-scoped policies
-- Users can only see locations from organizations they are members of
CREATE POLICY "Users can select locations in their organizations"
  ON public.locations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can only insert locations into organizations they are members of
CREATE POLICY "Users can insert locations in their organizations"
  ON public.locations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can only update locations in organizations they are members of
CREATE POLICY "Users can update locations in their organizations"
  ON public.locations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can only delete locations in organizations they are members of
CREATE POLICY "Users can delete locations in their organizations"
  ON public.locations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Note: Existing locations will have NULL organization_id
-- You may want to either:
-- 1. Assign them to a default organization, or
-- 2. Delete them if they're just test data
-- Example: UPDATE public.locations SET organization_id = 'your-org-id' WHERE organization_id IS NULL;
