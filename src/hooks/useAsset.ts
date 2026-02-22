import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Asset } from '../types/database'

export function useAsset(id: string | undefined) {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAsset = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setAsset(data as Asset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania zasobu')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAsset()
  }, [fetchAsset])

  return { asset, loading, error, refetch: fetchAsset }
}
