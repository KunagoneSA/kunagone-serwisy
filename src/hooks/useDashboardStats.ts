import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Deadline, AuditLogEntry } from '../types/database'

interface DeadlineWithAsset extends Deadline {
  asset_name: string
  asset_identifier: string
}

interface DashboardStats {
  totalAssets: number
  upcomingDeadlines: DeadlineWithAsset[]
  overdueCount: number
  recentActivity: AuditLogEntry[]
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    upcomingDeadlines: [],
    overdueCount: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const today = new Date().toISOString().split('T')[0]
      const in90days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [assetsResult, deadlinesResult, overdueResult, activityResult] = await Promise.all([
        // Total assets count
        supabase.from('assets').select('id', { count: 'exact', head: true }),

        // Upcoming deadlines (next 90 days, not completed) with asset info
        supabase
          .from('deadlines')
          .select('*, assets!inner(name, identifier)')
          .eq('completed', false)
          .gte('due_date', today)
          .lte('due_date', in90days)
          .order('due_date')
          .limit(20),

        // Overdue count
        supabase
          .from('deadlines')
          .select('id', { count: 'exact', head: true })
          .eq('completed', false)
          .lt('due_date', today),

        // Recent activity
        supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (assetsResult.error) throw assetsResult.error
      if (deadlinesResult.error) throw deadlinesResult.error
      if (overdueResult.error) throw overdueResult.error
      if (activityResult.error) throw activityResult.error

      // Also fetch overdue deadlines for the alert list
      const { data: overdueDeadlines } = await supabase
        .from('deadlines')
        .select('*, assets!inner(name, identifier)')
        .eq('completed', false)
        .lt('due_date', today)
        .order('due_date')
        .limit(20)

      const mapDeadlineWithAsset = (d: Record<string, unknown>): DeadlineWithAsset => {
        const assets = d.assets as { name: string; identifier: string } | null
        return {
          ...(d as unknown as Deadline),
          asset_name: assets?.name ?? '',
          asset_identifier: assets?.identifier ?? '',
        }
      }

      const allDeadlines = [
        ...(overdueDeadlines ?? []).map(mapDeadlineWithAsset),
        ...(deadlinesResult.data ?? []).map(mapDeadlineWithAsset),
      ]

      setStats({
        totalAssets: assetsResult.count ?? 0,
        upcomingDeadlines: allDeadlines,
        overdueCount: overdueResult.count ?? 0,
        recentActivity: (activityResult.data ?? []) as AuditLogEntry[],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania statystyk')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}
