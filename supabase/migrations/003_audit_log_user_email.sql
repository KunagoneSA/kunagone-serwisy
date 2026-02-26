-- Function to query audit_log with user email from auth.users
CREATE OR REPLACE FUNCTION get_audit_log(
  p_table_filter text DEFAULT NULL,
  p_user_filter uuid DEFAULT NULL,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  table_name text,
  record_id uuid,
  action audit_action,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  user_email text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    a.id,
    a.table_name,
    a.record_id,
    a.action,
    a.old_data,
    a.new_data,
    a.user_id,
    COALESCE(u.email, 'system') AS user_email,
    a.created_at
  FROM audit_log a
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE
    (p_table_filter IS NULL OR a.table_name = p_table_filter)
    AND (p_user_filter IS NULL OR a.user_id = p_user_filter)
    AND (p_date_from IS NULL OR a.created_at >= p_date_from)
    AND (p_date_to IS NULL OR a.created_at <= p_date_to)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Function to get distinct users from audit_log
CREATE OR REPLACE FUNCTION get_audit_users()
RETURNS TABLE (
  user_id uuid,
  user_email text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT
    a.user_id,
    COALESCE(u.email, 'system') AS user_email
  FROM audit_log a
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE a.user_id IS NOT NULL
  ORDER BY user_email;
$$;
