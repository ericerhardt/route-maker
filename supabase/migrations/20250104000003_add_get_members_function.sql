-- Create a function to get organization members with their emails
CREATE OR REPLACE FUNCTION public.get_organization_members_with_emails(org_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role public.organization_role,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  profile jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.id,
    om.user_id,
    om.role,
    om.created_at,
    om.updated_at,
    u.email::text,
    jsonb_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'avatar_url', p.avatar_url
    ) as profile
  FROM public.organization_members om
  JOIN auth.users u ON u.id = om.user_id
  LEFT JOIN public.profiles p ON p.id = om.user_id
  WHERE om.organization_id = org_id
  ORDER BY om.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_organization_members_with_emails(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_members_with_emails(uuid) TO anon;
