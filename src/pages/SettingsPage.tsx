import { LogOut, Mail, Bell, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNotificationSettings } from '../hooks/useNotificationSettings'

const notifyDaysOptions = [30, 14, 7, 1] as const

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { settings, loading, saving, error, updateSettings } = useNotificationSettings()

  const toggleNotifyDay = (day: number) => {
    if (!settings) return
    const current = settings.notify_days ?? []
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort((a, b) => b - a)
    updateSettings({ notify_days: updated })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ustawienia</h1>
      <p className="mt-1 text-sm text-slate-500">Profil i preferencje powiadomień.</p>

      {/* Profile section */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <User className="h-4 w-4" />
          Profil
        </h2>
        <div className="mt-4 flex items-center gap-4">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-lg">
              {(user?.email?.[0] ?? '?').toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user?.user_metadata?.full_name ?? 'Użytkownik'}
            </p>
            <p className="text-sm text-slate-500">{user?.email ?? ''}</p>
          </div>
        </div>
      </div>

      {/* Notifications section */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <Bell className="h-4 w-4" />
          Powiadomienia
        </h2>

        {loading ? (
          <div className="mt-4 flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
          </div>
        ) : error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            {error}
          </div>
        ) : settings ? (
          <div className="mt-4 space-y-5">
            {/* Email toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email</p>
                  <p className="text-xs text-slate-500">Powiadomienia o terminach na email</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ email_enabled: !settings.email_enabled })}
                disabled={saving}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.email_enabled ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.email_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Push toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Push</p>
                  <p className="text-xs text-slate-500">Powiadomienia push w przeglądarce</p>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ push_enabled: !settings.push_enabled })}
                disabled={saving}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.push_enabled ? 'bg-amber-500' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.push_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Notify days */}
            <div>
              <p className="text-sm font-medium text-slate-900">Dni przed terminem</p>
              <p className="text-xs text-slate-500 mb-2">Ile dni przed terminem wysłać powiadomienie</p>
              <div className="flex gap-2 flex-wrap">
                {notifyDaysOptions.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleNotifyDay(day)}
                    disabled={saving}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      settings.notify_days?.includes(day)
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {day} {day === 1 ? 'dzień' : 'dni'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Logout */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Wyloguj się
        </button>
      </div>
    </div>
  )
}
