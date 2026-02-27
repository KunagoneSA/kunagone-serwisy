-- Returns deadlines needing notification today, with guardian emails
-- Checks deadlines due in exactly N days where N matches any guardian's notification_settings.notify_days
CREATE OR REPLACE FUNCTION get_pending_notifications()
RETURNS TABLE (
  deadline_id uuid,
  deadline_title text,
  due_date date,
  days_until int,
  asset_name text,
  asset_identifier text,
  guardian_email text,
  guardian_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    d.id AS deadline_id,
    d.title AS deadline_title,
    d.due_date::date,
    (d.due_date::date - CURRENT_DATE) AS days_until,
    a.name AS asset_name,
    a.identifier AS asset_identifier,
    u.email AS guardian_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS guardian_name
  FROM deadlines d
  JOIN assets a ON a.id = d.asset_id
  JOIN asset_guardians ag ON ag.asset_id = d.asset_id
  JOIN auth.users u ON u.id = ag.user_id
  JOIN notification_settings ns ON ns.user_id = ag.user_id
  WHERE
    d.completed = false
    AND d.due_date IS NOT NULL
    AND ns.email_enabled = true
    AND (d.due_date::date - CURRENT_DATE) = ANY(ns.notify_days)
  ORDER BY d.due_date, a.name;
$$;
