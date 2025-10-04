-- Complete RLS Policy Fix
-- This removes all circular dependencies by using SECURITY DEFINER functions

-- Drop all organization_members policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can add members to their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.organization_members;

-- Drop problematic organization policies
DROP POLICY IF EXISTS "Users can view organizations they are members of" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations;

-- Drop problematic invitation policies
DROP POLICY IF EXISTS "Users can view invitations for their organizations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;

-- Create helper function to check membership without recursion
CREATE OR REPLACE FUNCTION public.user_is_member_of_org(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check admin/owner status
CREATE OR REPLACE FUNCTION public.user_is_org_admin(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create helper function to check owner status
CREATE OR REPLACE FUNCTION public.user_is_org_owner(org_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = user_uuid
    AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate organization_members policies without recursion
CREATE POLICY "Users can view members of their organizations"
  ON public.organization_members FOR SELECT
  USING (public.user_is_member_of_org(organization_id, auth.uid()));

CREATE POLICY "Admins can add members to their organizations"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update member roles"
  ON public.organization_members FOR UPDATE
  USING (public.user_is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    public.user_is_org_admin(organization_id, auth.uid())
    OR user_id = auth.uid()
  );

-- Recreate organization policies
CREATE POLICY "Users can view organizations they are members of"
  ON public.organizations FOR SELECT
  USING (public.user_is_member_of_org(id, auth.uid()));

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  USING (public.user_is_org_admin(id, auth.uid()));

CREATE POLICY "Owners can delete their organizations"
  ON public.organizations FOR DELETE
  USING (public.user_is_org_owner(id, auth.uid()));

-- Recreate invitation policies
CREATE POLICY "Users can view invitations for their organizations"
  ON public.invitations FOR SELECT
  USING (
    public.user_is_org_admin(organization_id, auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.user_is_org_admin(organization_id, auth.uid()));

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    public.user_is_org_admin(organization_id, auth.uid())
    OR (email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending')
  );

CREATE POLICY "Admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.user_is_org_admin(organization_id, auth.uid()));
