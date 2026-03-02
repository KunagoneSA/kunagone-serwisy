import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface MileageReport {
  id: string
  asset_id: string
  mileage: number
  photo_path: string | null
  notes: string | null
  reported_by: string | null
  created_at: string
  reporter_email?: string
  reporter_name?: string
}

export function useMileageReports(assetId?: string) {
  const [reports, setReports] = useState<MileageReport[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    if (!assetId) return
    setLoading(true)

    const { data } = await supabase
      .from('mileage_reports')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      // Fetch reporter info for all unique user IDs
      const userIds = [...new Set(data.map((r) => r.reported_by).filter(Boolean))] as string[]

      let userMap: Record<string, { email: string; name: string }> = {}
      if (userIds.length > 0) {
        const { data: users } = await supabase.rpc('get_all_users')
        if (users) {
          for (const u of users) {
            userMap[u.id] = { email: u.email, name: u.full_name }
          }
        }
      }

      setReports(
        data.map((r) => ({
          ...r,
          reporter_email: r.reported_by ? userMap[r.reported_by]?.email : undefined,
          reporter_name: r.reported_by ? userMap[r.reported_by]?.name : undefined,
        }))
      )
    }

    setLoading(false)
  }, [assetId])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  return { reports, loading, refetch: fetchReports }
}
