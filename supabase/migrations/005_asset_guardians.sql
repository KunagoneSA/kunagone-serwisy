-- Asset guardians table - up to 3 guardians per asset who receive notifications
CREATE TABLE asset_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 3),
  created_at timestamptz DEFAULT now(),
  UNIQUE (asset_id, position),
  UNIQUE (asset_id, user_id)
);

-- Indexes
CREATE INDEX idx_asset_guardians_asset ON asset_guardians(asset_id);
CREATE INDEX idx_asset_guardians_user ON asset_guardians(user_id);

-- RLS
ALTER TABLE asset_guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read guardians"
  ON asset_guardians FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage guardians"
  ON asset_guardians FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Function to list all auth users (for guardian picker)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS full_name
  FROM auth.users u
  ORDER BY u.email;
$$;

-- Function to get guardians with user details for an asset
CREATE OR REPLACE FUNCTION get_asset_guardians(p_asset_id uuid)
RETURNS TABLE (
  id uuid,
  asset_id uuid,
  user_id uuid,
  "position" smallint,
  user_email text,
  user_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    ag.id,
    ag.asset_id,
    ag.user_id,
    ag.position,
    u.email AS user_email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS user_name
  FROM asset_guardians ag
  JOIN auth.users u ON u.id = ag.user_id
  WHERE ag.asset_id = p_asset_id
  ORDER BY ag.position;
$$;

-- Seed: Add office.kunagone@gmail.com as guardian #1 for all existing assets
DO $$
DECLARE
  v_user_id uuid;
  v_asset_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'office.kunagone@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    FOR v_asset_id IN SELECT id FROM assets LOOP
      INSERT INTO asset_guardians (asset_id, user_id, position)
      VALUES (v_asset_id, v_user_id, 1)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
