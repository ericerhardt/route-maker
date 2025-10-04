-- Create the missing profile record for your user
INSERT INTO public.profiles (id, first_name, last_name, created_at, updated_at)
VALUES (
  'b5e02a9e-b2cb-4bdd-aea3-86b0855a0d8c',
  'Eric',
  'Erhardt',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET first_name = 'Eric', last_name = 'Erhardt', updated_at = NOW();

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify the profile was created
SELECT id, first_name, last_name FROM public.profiles WHERE id = 'b5e02a9e-b2cb-4bdd-aea3-86b0855a0d8c';
