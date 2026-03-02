-- Mileage reports table - history of mileage submissions
CREATE TABLE IF NOT EXISTS mileage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  mileage integer NOT NULL,
  photo_path text,
  notes text,
  reported_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE mileage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mileage_reports"
  ON mileage_reports FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert mileage_reports"
  ON mileage_reports FOR INSERT
  TO authenticated WITH CHECK (true);

-- Index for fast lookups by asset
CREATE INDEX IF NOT EXISTS idx_mileage_reports_asset_id ON mileage_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_mileage_reports_created_at ON mileage_reports(created_at DESC);

-- Storage bucket for mileage photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('mileage-photos', 'mileage-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload mileage photos"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'mileage-photos');

CREATE POLICY "Anyone can view mileage photos"
  ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'mileage-photos');
