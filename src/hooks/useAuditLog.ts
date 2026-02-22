import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLogEntry } from '../types/database'

const PAGE_SIZE = 20

interface UseAuditLogOptions {
  tableFilter?: string | null
  dateFrom?: string
  dateTo?: string
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { tableFilter, dateFrom, dateTo } = options

  const fetchEntries = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)
    setError(null)

    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (tableFilter) {
        query = query.eq('table_name', tableFilter)
      }

      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00`)
      }

      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const rows = (data ?? []) as AuditLogEntry[]
      setHasMore(rows.length === PAGE_SIZE)

      if (append) {
        setEntries((prev) => [...prev, ...rows])
      } else {
        setEntries(rows)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania historii')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tableFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchEntries(0)
  }, [fetchEntries])

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEntries(entries.length, true)
    }
  }

  return { entries, loading, loadingMore, hasMore, error, loadMore }
}
