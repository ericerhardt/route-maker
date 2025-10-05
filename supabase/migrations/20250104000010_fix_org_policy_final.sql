-- List all current policies on organizations table to see what's there
-- DROP ALL existing INSERT policies on organizations
DROP POLICY IF EXISTS "organizations_insert_policy" ON "public"."organizations";
DROP POLICY IF EXISTS "authenticated_users_can_create_orgs" ON "public"."organizations";

-- Create a simple, permissive policy for authenticated users to create organizations
CREATE POLICY "allow_authenticated_create_org"
  ON "public"."organizations"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant the necessary permissions
GRANT INSERT ON "public"."organizations" TO authenticated;
