-- Check and ensure proper grants for organizations table
-- Grant all necessary permissions to authenticated users

-- First, ensure the table has proper grants
GRANT ALL ON public.organizations TO authenticated;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "simple_authenticated_insert" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_insert" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "Allow authenticated users to insert organizations" ON public.organizations;

-- Create a fresh insert policy with the absolute simplest check
CREATE POLICY "enable_insert_for_authenticated_users"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure other necessary policies exist
DROP POLICY IF EXISTS "select_own_organizations" ON public.organizations;
CREATE POLICY "select_own_organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_organizations" ON public.organizations;
CREATE POLICY "update_own_organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );
