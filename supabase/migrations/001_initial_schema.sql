-- Kunagone Serwisy - Initial Database Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Enums
CREATE TYPE asset_type AS ENUM ('vehicle', 'equipment', 'infrastructure');
CREATE TYPE service_status AS ENUM ('done', 'pending', 'waiting', 'external', 'postponed');
CREATE TYPE deadline_type AS ENUM ('insurance', 'inspection', 'homologation', 'service', 'other');
CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- Assets
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  identifier text NOT NULL,
  type asset_type NOT NULL,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Service entries
CREATE TABLE service_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  date date NOT NULL,
  description text NOT NULL,
  status service_status NOT NULL DEFAULT 'done',
  mileage integer,
  notes text,
  priority integer CHECK (priority BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Deadlines
CREATE TABLE deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  type deadline_type NOT NULL,
  title text NOT NULL,
  due_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  notify_days_before integer[] DEFAULT '{30,14,7,1}',
  completed boolean DEFAULT false,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Audit log
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action audit_action NOT NULL,
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Notification settings
CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT false,
  notify_days integer[] DEFAULT '{30,14,7,1}',
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_service_entries_asset ON service_entries(asset_id);
CREATE INDEX idx_service_entries_date ON service_entries(date DESC);
CREATE INDEX idx_deadlines_asset ON deadlines(asset_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);
CREATE INDEX idx_deadlines_active ON deadlines(due_date) WHERE completed = false;
CREATE INDEX idx_audit_log_table ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can read/write shared data
CREATE POLICY "Authenticated users can read assets" ON assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert assets" ON assets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update assets" ON assets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read service_entries" ON service_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert service_entries" ON service_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update service_entries" ON service_entries FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read deadlines" ON deadlines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert deadlines" ON deadlines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update deadlines" ON deadlines FOR UPDATE TO authenticated USING (true);

-- Audit log: read all, insert only (append-only)
CREATE POLICY "Authenticated users can read audit_log" ON audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert audit_log" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Push subscriptions: users manage their own
CREATE POLICY "Users manage own push_subscriptions" ON push_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notification settings: users manage their own
CREATE POLICY "Users manage own notification_settings" ON notification_settings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers
CREATE TRIGGER audit_assets AFTER INSERT OR UPDATE OR DELETE ON assets FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_service_entries AFTER INSERT OR UPDATE OR DELETE ON service_entries FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER audit_deadlines AFTER INSERT OR UPDATE OR DELETE ON deadlines FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON service_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
