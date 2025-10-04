-- Temporarily disable RLS on organizations to test
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Also check if RLS is enabled on other tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'organization_members', 'profiles', 'invitations', 'projects');
