-- Fix organization_members INSERT policy
-- The current policy checks if user is already an admin, but that's a chicken-and-egg problem

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can add members to organizations" ON public.organization_members;

-- Create a simple policy that allows authenticated users to insert themselves
CREATE POLICY "organization_members_insert_policy"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow user to add themselves
    user_id = auth.uid()
  );

-- Verify the policy
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'organization_members' AND cmd = 'INSERT';
