-- Fix projects table to add missing columns
-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN description TEXT;
  END IF;
END $$;

-- Ensure all other required columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'projects'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.projects ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update table comment
COMMENT ON TABLE public.projects IS 'Route projects - stores routing projects for organizations in RouteMaker';
