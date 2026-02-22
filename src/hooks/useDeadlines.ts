import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Deadline } from '../types/database'

export function useDeadlines(assetId: string | undefined) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeadlines = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('deadlines')
        .select('*')
        .eq('asset_id', assetId)
        .order('completed')
        .order('due_date')

      if (fetchError) throw fetchError
      setDeadlines((data ?? []) as Deadline[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania terminów')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => {
    fetchDeadlines()
  }, [fetchDeadlines])

  return { deadlines, loading, error, refetch: fetchDeadlines }
}
