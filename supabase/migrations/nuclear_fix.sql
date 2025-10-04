-- Nuclear option: Completely disable RLS on organizations
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'organizations' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organizations', r.policyname);
  END LOOP;
END $$;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'organizations' AND schemaname = 'public';
