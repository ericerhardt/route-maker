-- Re-enable RLS on organizations with proper policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy (allow authenticated users to create orgs)
CREATE POLICY "organizations_insert_policy"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create SELECT policy (users can view orgs they're members of)
CREATE POLICY "organizations_select_policy"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Create UPDATE policy (admins/owners can update)
CREATE POLICY "organizations_update_policy"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- Create DELETE policy (only owners can delete)
CREATE POLICY "organizations_delete_policy"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role = 'owner'
    )
  );

-- Verify RLS is enabled and policies are created
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'organizations';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'organizations' ORDER BY cmd, policyname;
