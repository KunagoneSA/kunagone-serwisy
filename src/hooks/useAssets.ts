import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AssetType } from '../types/database'

export interface AssetWithExtras {
  id: string
  name: string
  identifier: string
  type: AssetType
  current_mileage: number | null
  notes: string | null
  metadata: Record<string, string>
  created_at: string
  created_by: string | null
  next_deadline_date: string | null
  next_deadline_title: string | null
  next_deadline_mileage: number | null
  next_deadline_mileage_title: string | null
  last_service_date: string | null
}

interface UseAssetsOptions {
  search?: string
  typeFilter?: AssetType | null
}

export function useAssets(options: UseAssetsOptions = {}) {
  const [assets, setAssets] = useState<AssetWithExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { search, typeFilter } = options

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase.rpc('search_assets_v2', {
        p_search: search || null,
        p_type_filter: typeFilter || null,
      })

      if (fetchError) throw fetchError

      setAssets((data ?? []) as AssetWithExtras[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania zasobów')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return { assets, loading, error, refetch: fetchAssets }
}
