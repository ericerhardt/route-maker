-- Drop and recreate the function with the correct pg_net syntax
DROP FUNCTION IF EXISTS public.send_invitation_email() CASCADE;

-- Create a trigger to send email when invitation is created
CREATE OR REPLACE FUNCTION public.send_invitation_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only send email for new pending invitations
  IF NEW.status = 'pending' AND TG_OP = 'INSERT' THEN
    -- Call the edge function via pg_net (runs async)
    SELECT net.http_post(
      url := 'https://kpwyxqpiwrygsjnlaxkm.supabase.co/functions/v1/send-invite-email',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'invitations',
        'record', row_to_json(NEW)
      )
    ) INTO request_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_invitation_created ON public.invitations;
CREATE TRIGGER on_invitation_created
  AFTER INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.send_invitation_email();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.send_invitation_email() TO postgres;
GRANT EXECUTE ON FUNCTION public.send_invitation_email() TO service_role;
GRANT USAGE ON SCHEMA net TO postgres;
GRANT USAGE ON SCHEMA net TO service_role;
