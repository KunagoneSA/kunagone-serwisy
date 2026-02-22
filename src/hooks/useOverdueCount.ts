import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOverdueCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchCount = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]

    const { count: overdueCount, error } = await supabase
      .from('deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('completed', false)
      .lt('due_date', today)

    if (!error && overdueCount !== null) {
      setCount(overdueCount)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCount()

    // Re-check every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return { count, loading }
}
