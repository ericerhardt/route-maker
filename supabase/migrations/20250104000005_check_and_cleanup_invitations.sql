-- Check for duplicate tokens (for debugging)
-- This will show any duplicate tokens in the invitations table
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT token, COUNT(*) as cnt
    FROM invitations
    GROUP BY token
    HAVING COUNT(*) > 1
  ) duplicates;

  RAISE NOTICE 'Found % duplicate tokens', duplicate_count;
END $$;

-- Clean up any test/development data that might be causing issues
-- Option 1: Delete all non-pending invitations older than 1 hour (keeps history recent)
DELETE FROM invitations
WHERE status IN ('revoked', 'expired', 'accepted')
  AND created_at < NOW() - INTERVAL '1 hour';

-- Option 2: If you want to keep a clean slate, uncomment this to delete ALL old invitations
-- DELETE FROM invitations WHERE created_at < NOW() - INTERVAL '1 day';

-- Ensure token uniqueness going forward (should already exist from previous migration)
-- This is a safety check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'invitations_token_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invitations_token_key'
  ) THEN
    -- Add unique constraint on token if it doesn't exist
    ALTER TABLE invitations ADD CONSTRAINT invitations_token_key_new UNIQUE (token);
  END IF;
END $$;
