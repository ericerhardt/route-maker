-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "organizations_insert_policy" ON "public"."organizations";

-- Create a new policy that allows any authenticated user to create an organization
-- They will automatically become the owner via the application logic
CREATE POLICY "authenticated_users_can_create_orgs"
  ON "public"."organizations"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be authenticated
    auth.uid() IS NOT NULL
    -- And the created_by field should match the current user
    AND created_by = auth.uid()
  );

COMMENT ON POLICY "authenticated_users_can_create_orgs" ON "public"."organizations" IS
  'Allows authenticated users to create organizations. They become the owner via application logic in organization_members table.';
