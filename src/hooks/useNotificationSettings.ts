import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { NotificationSettings } from '../types/database'

const defaults: Omit<NotificationSettings, 'id' | 'user_id'> = {
  email_enabled: true,
  push_enabled: false,
  notify_days: [30, 14, 7, 1],
}

export function useNotificationSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data) {
        setSettings(data as NotificationSettings)
      } else {
        // Create default settings on first access
        const { data: inserted, error: insertError } = await supabase
          .from('notification_settings')
          .insert({ user_id: user.id, ...defaults })
          .select()
          .single()

        if (insertError) throw insertError
        setSettings(inserted as NotificationSettings)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd ładowania ustawień')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (updates: Partial<Omit<NotificationSettings, 'id' | 'user_id'>>) => {
    if (!settings) return
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('notification_settings')
        .update(updates)
        .eq('id', settings.id)

      if (updateError) throw updateError
      setSettings({ ...settings, ...updates })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu ustawień')
    } finally {
      setSaving(false)
    }
  }

  return { settings, loading, saving, error, updateSettings }
}
