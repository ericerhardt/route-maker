-- Disable the database trigger since we're now sending emails from the frontend
DROP TRIGGER IF EXISTS on_invitation_created ON public.invitations;

-- Keep the function in case we want to re-enable it later, but it won't be called
-- DROP FUNCTION IF EXISTS public.send_invitation_email() CASCADE;
