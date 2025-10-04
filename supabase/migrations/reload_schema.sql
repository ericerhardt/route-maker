-- Reload the PostgREST schema cache
-- This is needed after creating new tables/columns
NOTIFY pgrst, 'reload schema';
