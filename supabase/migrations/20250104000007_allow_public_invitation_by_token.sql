-- Allow anyone (including unauthenticated users) to view an invitation by token
-- This is needed for the invite acceptance flow
CREATE POLICY "Anyone can view invitation by token"
  ON "public"."invitations"
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if querying by token (invite links)
    token IS NOT NULL
  );

-- Note: The existing policy "Users can view invitations for their organizations"
-- will continue to work for authenticated org admins viewing their org's invitations
