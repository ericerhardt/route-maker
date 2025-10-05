-- Re-enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;
DROP POLICY IF EXISTS "authenticated_users_can_create_orgs" ON public.organizations;
DROP POLICY IF EXISTS "allow_authenticated_create_org" ON public.organizations;
DROP POLICY IF EXISTS "anyone_can_insert_org" ON public.organizations;

-- Create a proper INSERT policy: any authenticated user can create an org
CREATE POLICY "authenticated_can_create_organization"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
  );

-- Keep the existing SELECT policy (users can only see orgs they're members of)
-- Keep the existing UPDATE policy (only admins/owners can update)
-- Keep the existing DELETE policy (only owners can delete)

COMMENT ON POLICY "authenticated_can_create_organization" ON public.organizations IS
  'Any authenticated user can create an organization and will be set as created_by';
