-- Drop the old unique constraint that prevents reinviting after revoke
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_organization_id_email_status_key;

-- Create a partial unique index that only applies to pending invitations
-- This allows multiple revoked/expired/accepted invitations for the same email
CREATE UNIQUE INDEX IF NOT EXISTS invitations_org_email_pending_unique
  ON public.invitations (organization_id, email)
  WHERE status = 'pending';

-- Add comment explaining the constraint
COMMENT ON INDEX invitations_org_email_pending_unique IS
  'Ensures only one pending invitation per email per organization. Allows re-inviting after revoke/expire/accept.';
