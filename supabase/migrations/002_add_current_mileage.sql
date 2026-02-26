-- Add current_mileage column to assets table
ALTER TABLE assets ADD COLUMN current_mileage integer DEFAULT NULL;
COMMENT ON COLUMN assets.current_mileage IS 'Aktualny przebieg pojazdu w km';

-- Add due_mileage column to deadlines table (mileage-based deadlines)
ALTER TABLE deadlines ADD COLUMN due_mileage integer DEFAULT NULL;
COMMENT ON COLUMN deadlines.due_mileage IS 'Termin przebiegowy w km (np. wymiana oleju przy 150000 km)';

-- Make due_date nullable (deadline can be date-based, mileage-based, or both)
ALTER TABLE deadlines ALTER COLUMN due_date DROP NOT NULL;
