import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Guardian {
  id: string
  asset_id: string
  user_id: string
  position: number
  user_email: string
  user_name: string
}

export interface AppUser {
  id: string
  email: string
  full_name: string
}

export function useAssetGuardians(assetId?: string) {
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!assetId) return
    setLoading(true)
    const { data } = await supabase.rpc('get_asset_guardians', { p_asset_id: assetId })
    setGuardians((data ?? []) as Guardian[])
    setLoading(false)
  }, [assetId])

  useEffect(() => { fetch() }, [fetch])

  const setGuardian = async (position: number, userId: string) => {
    if (!assetId) return
    // Remove existing guardian at this position
    await supabase.from('asset_guardians').delete().eq('asset_id', assetId).eq('position', position)
    // Insert new
    await supabase.from('asset_guardians').insert({ asset_id: assetId, user_id: userId, position })
    fetch()
  }

  const removeGuardian = async (position: number) => {
    if (!assetId) return
    await supabase.from('asset_guardians').delete().eq('asset_id', assetId).eq('position', position)
    fetch()
  }

  return { guardians, loading, setGuardian, removeGuardian, refetch: fetch }
}

export function useAllUsers() {
  const [users, setUsers] = useState<AppUser[]>([])

  useEffect(() => {
    supabase.rpc('get_all_users').then(({ data }) => {
      if (data) setUsers(data as AppUser[])
    })
  }, [])

  return users
}
