-- Fix organization creation flow
-- Allow users to add themselves as the first member when they create an org

-- Drop and recreate the INSERT policy for organization_members
DROP POLICY IF EXISTS "Admins can add members to their organizations" ON public.organization_members;

CREATE POLICY "Users can add members to organizations"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    -- Allow if user is admin/owner of the org
    public.user_is_org_admin(organization_id, auth.uid())
    -- OR allow if this is the first member (org creator adding themselves)
    OR (
      user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = organization_members.organization_id
      )
    )
  );
