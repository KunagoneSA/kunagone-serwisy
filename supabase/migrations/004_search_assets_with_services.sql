-- Search assets by name, identifier, OR service entry descriptions
CREATE OR REPLACE FUNCTION search_assets(
  p_search text DEFAULT NULL,
  p_type_filter asset_type DEFAULT NULL
)
RETURNS SETOF assets
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT a.*
  FROM assets a
  LEFT JOIN service_entries se ON se.asset_id = a.id
  WHERE
    (p_type_filter IS NULL OR a.type = p_type_filter)
    AND (
      p_search IS NULL
      OR a.name ILIKE '%' || p_search || '%'
      OR a.identifier ILIKE '%' || p_search || '%'
      OR se.description ILIKE '%' || p_search || '%'
      OR se.notes ILIKE '%' || p_search || '%'
    )
  ORDER BY a.name;
$$;
