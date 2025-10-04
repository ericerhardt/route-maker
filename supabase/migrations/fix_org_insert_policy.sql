-- Fix organizations INSERT policy
-- The issue is that the INSERT policy might be missing or incorrect

-- Drop and recreate the INSERT policy for organizations
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );
