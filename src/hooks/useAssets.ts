import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset, AssetType } from '../types/database'

interface AssetWithExtras extends Asset {
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
      let query = supabase
        .from('assets')
        .select('*')
        .order('name')

      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,identifier.ilike.%${search}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const rows = (data ?? []) as Asset[]

      const assetsWithExtras: AssetWithExtras[] = await Promise.all(
        rows.map(async (asset) => {
          const [deadlineResult, mileageDeadlineResult, serviceResult] = await Promise.all([
            supabase
              .from('deadlines')
              .select('due_date, title')
              .eq('asset_id', asset.id)
              .eq('completed', false)
              .not('due_date', 'is', null)
              .gte('due_date', new Date().toISOString().split('T')[0])
              .order('due_date')
              .limit(1)
              .maybeSingle(),
            supabase
              .from('deadlines')
              .select('due_mileage, title')
              .eq('asset_id', asset.id)
              .eq('completed', false)
              .not('due_mileage', 'is', null)
              .order('due_mileage')
              .limit(1)
              .maybeSingle(),
            supabase
              .from('service_entries')
              .select('date')
              .eq('asset_id', asset.id)
              .order('date', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ])

          return {
            ...asset,
            next_deadline_date: (deadlineResult.data as { due_date: string } | null)?.due_date ?? null,
            next_deadline_title: (deadlineResult.data as { title: string } | null)?.title ?? null,
            next_deadline_mileage: (mileageDeadlineResult.data as { due_mileage: number } | null)?.due_mileage ?? null,
            next_deadline_mileage_title: (mileageDeadlineResult.data as { title: string } | null)?.title ?? null,
            last_service_date: (serviceResult.data as { date: string } | null)?.date ?? null,
          }
        })
      )

      setAssets(assetsWithExtras)
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
