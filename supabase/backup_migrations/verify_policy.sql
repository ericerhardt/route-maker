-- Verify the INSERT policy exists
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'organizations'
  AND cmd = 'INSERT';
