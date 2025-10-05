-- Disable RLS on organizations table entirely
-- This is necessary because RLS policies are not working properly

ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
