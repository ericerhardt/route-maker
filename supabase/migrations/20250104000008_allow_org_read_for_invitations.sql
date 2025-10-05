-- Allow anonymous users to read organization info when viewing an invitation
-- This is needed so the join in the invitation query works for unauthenticated users
CREATE POLICY "Anyone can view org info via invitation"
  ON "public"."organizations"
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if this organization has a pending invitation (joining through invitations table)
    EXISTS (
      SELECT 1
      FROM public.invitations
      WHERE invitations.organization_id = organizations.id
      AND invitations.status = 'pending'
    )
  );
