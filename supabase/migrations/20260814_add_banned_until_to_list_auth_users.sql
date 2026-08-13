-- Add banned_until to list_auth_users function
DROP FUNCTION IF EXISTS list_auth_users();

CREATE FUNCTION list_auth_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  banned_until TIMESTAMPTZ
) AS $$
  SELECT id, email, last_sign_in_at, created_at, banned_until FROM auth.users ORDER BY email;
$$ LANGUAGE sql SECURITY DEFINER;
