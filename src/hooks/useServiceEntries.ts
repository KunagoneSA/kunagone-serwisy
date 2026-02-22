import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ServiceEntry } from '../types/database'

export function useServiceEntries(assetId: string | undefined) {
  const [entries, setEntries] = useState<ServiceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('service_entries')
        .select('*')
        .eq('asset_id', assetId)
        .order('date', { ascending: false })

      if (fetchError) throw fetchError
      setEntries((data ?? []) as ServiceEntry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania wpisów serwisowych')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  return { entries, loading, error, refetch: fetchEntries }
}
