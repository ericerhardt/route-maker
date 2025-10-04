-- Check the actual WITH CHECK clause for the INSERT policy
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'organizations'
  AND cmd = 'INSERT';

-- Also check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organizations' AND schemaname = 'public';

-- Try a different approach - use a more explicit policy
DROP POLICY IF EXISTS "organizations_insert_policy" ON public.organizations;

CREATE POLICY "organizations_insert_policy"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );
