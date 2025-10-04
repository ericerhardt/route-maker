-- Fix RLS Policy Infinite Recursion
-- This fixes the circular dependency in organization_members policies

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can add members to their organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.organization_members;

-- Recreate with SECURITY DEFINER function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_org_admin_or_owner(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the function
CREATE POLICY "Admins can add members to their organizations"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.is_org_admin_or_owner(organization_id));

CREATE POLICY "Admins can update member roles"
  ON public.organization_members FOR UPDATE
  USING (public.is_org_admin_or_owner(organization_id));

CREATE POLICY "Admins can remove members"
  ON public.organization_members FOR DELETE
  USING (
    public.is_org_admin_or_owner(organization_id)
    OR user_id = auth.uid() -- Users can remove themselves
  );
