import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AuditLogEntry, AuditUser } from '../types/database'

const PAGE_SIZE = 20

interface UseAuditLogOptions {
  tableFilter?: string | null
  userFilter?: string | null
  dateFrom?: string
  dateTo?: string
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { tableFilter, userFilter, dateFrom, dateTo } = options

  const fetchEntries = useCallback(async (offset = 0, append = false) => {
    if (offset === 0) setLoading(true)
    else setLoadingMore(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase.rpc('get_audit_log', {
        p_table_filter: tableFilter || null,
        p_user_filter: userFilter || null,
        p_date_from: dateFrom ? `${dateFrom}T00:00:00` : null,
        p_date_to: dateTo ? `${dateTo}T23:59:59` : null,
        p_limit: PAGE_SIZE,
        p_offset: offset,
      })

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
  }, [tableFilter, userFilter, dateFrom, dateTo])

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

export function useAuditUsers() {
  const [users, setUsers] = useState<AuditUser[]>([])

  useEffect(() => {
    supabase.rpc('get_audit_users').then(({ data }) => {
      if (data) setUsers(data as AuditUser[])
    })
  }, [])

  return users
}
