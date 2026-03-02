-- Optimized search_assets that returns deadline + service info in one query
-- Eliminates N+1 problem (was: 1 RPC + 3 queries per asset)
CREATE OR REPLACE FUNCTION search_assets_v2(
  p_search text DEFAULT NULL,
  p_type_filter asset_type DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  name text,
  identifier text,
  type asset_type,
  current_mileage integer,
  notes text,
  metadata jsonb,
  created_at timestamptz,
  created_by uuid,
  next_deadline_date date,
  next_deadline_title text,
  next_deadline_mileage integer,
  next_deadline_mileage_title text,
  last_service_date date
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    a.id,
    a.name,
    a.identifier,
    a.type,
    a.current_mileage,
    a.notes,
    a.metadata,
    a.created_at,
    a.created_by,
    -- Next date-based deadline
    (SELECT d.due_date FROM deadlines d
     WHERE d.asset_id = a.id AND d.completed = false
       AND d.due_date IS NOT NULL AND d.due_date >= CURRENT_DATE
     ORDER BY d.due_date LIMIT 1
    ) AS next_deadline_date,
    (SELECT d.title FROM deadlines d
     WHERE d.asset_id = a.id AND d.completed = false
       AND d.due_date IS NOT NULL AND d.due_date >= CURRENT_DATE
     ORDER BY d.due_date LIMIT 1
    ) AS next_deadline_title,
    -- Next mileage-based deadline
    (SELECT d.due_mileage FROM deadlines d
     WHERE d.asset_id = a.id AND d.completed = false
       AND d.due_mileage IS NOT NULL
     ORDER BY d.due_mileage LIMIT 1
    ) AS next_deadline_mileage,
    (SELECT d.title FROM deadlines d
     WHERE d.asset_id = a.id AND d.completed = false
       AND d.due_mileage IS NOT NULL
     ORDER BY d.due_mileage LIMIT 1
    ) AS next_deadline_mileage_title,
    -- Last service date
    (SELECT se.date FROM service_entries se
     WHERE se.asset_id = a.id
     ORDER BY se.date DESC LIMIT 1
    ) AS last_service_date
  FROM assets a
  WHERE
    (p_type_filter IS NULL OR a.type = p_type_filter)
    AND (
      p_search IS NULL
      OR a.name ILIKE '%' || p_search || '%'
      OR a.identifier ILIKE '%' || p_search || '%'
      OR EXISTS (
        SELECT 1 FROM service_entries se
        WHERE se.asset_id = a.id
          AND (se.description ILIKE '%' || p_search || '%' OR se.notes ILIKE '%' || p_search || '%')
      )
    )
  ORDER BY a.name;
$$;
