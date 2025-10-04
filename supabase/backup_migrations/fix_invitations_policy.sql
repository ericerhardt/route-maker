-- Fix invitations policy to avoid direct auth.users access
DROP POLICY IF EXISTS "Users can view invitations for their organizations" ON public.invitations;

CREATE POLICY "Users can view invitations for their organizations"
  ON public.invitations FOR SELECT
  USING (
    public.user_is_org_admin(organization_id, auth.uid())
    OR email = auth.email()
  );

DROP POLICY IF EXISTS "Admins can update invitations" ON public.invitations;

CREATE POLICY "Admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    public.user_is_org_admin(organization_id, auth.uid())
    OR (email = auth.email() AND status = 'pending')
  );
