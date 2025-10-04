-- Check current policies and recreate them properly
-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'organizations';

-- Drop ALL existing policies on organizations to start fresh
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations;

-- Recreate with simple, clear policies
CREATE POLICY "enable_insert_for_authenticated_users"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "enable_select_for_members"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (public.user_is_member_of_org(id, auth.uid()));

CREATE POLICY "enable_update_for_admins"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (public.user_is_org_admin(id, auth.uid()));

CREATE POLICY "enable_delete_for_owners"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (public.user_is_org_owner(id, auth.uid()));
