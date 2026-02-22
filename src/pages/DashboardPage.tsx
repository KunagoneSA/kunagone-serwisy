import { useNavigate } from 'react-router-dom'
import { Truck, CalendarClock, AlertTriangle, Clock } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'

const actionLabels: Record<string, string> = {
  insert: 'Dodano',
  update: 'Zaktualizowano',
  delete: 'Usunięto',
}

const tableLabels: Record<string, string> = {
  assets: 'zasób',
  service_entries: 'wpis serwisowy',
  deadlines: 'termin',
}

function getUrgencyClasses(dueDate: string): { dot: string; bg: string } {
  const days = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 0) return { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100' }
  if (days <= 7) return { dot: 'bg-red-500', bg: 'bg-red-50 border-red-100' }
  if (days <= 30) return { dot: 'bg-amber-400', bg: 'bg-amber-50 border-amber-100' }
  return { dot: 'bg-emerald-400', bg: 'bg-emerald-50 border-emerald-100' }
}

function formatDaysLabel(dueDate: string): string {
  const days = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 0) return `${Math.abs(days)} dni po terminie`
  if (days === 0) return 'Dzisiaj!'
  if (days === 1) return 'Jutro'
  return `za ${days} dni`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { stats, loading, error } = useDashboardStats()

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel główny</h1>
      <p className="mt-1 text-sm text-slate-500">Przegląd floty i nadchodzących terminów.</p>

      {/* Summary cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Truck className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.totalAssets}</p>
              <p className="text-xs text-slate-500">Zasoby</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <CalendarClock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.upcomingDeadlines.length}</p>
              <p className="text-xs text-slate-500">Nadchodzące terminy</p>
            </div>
          </div>
        </div>

        <div className={`rounded-xl border p-5 ${
          stats.overdueCount > 0
            ? 'border-red-200 bg-red-50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              stats.overdueCount > 0 ? 'bg-red-100' : 'bg-slate-100'
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${
                stats.overdueCount > 0 ? 'text-red-700' : 'text-slate-900'
              }`}>{stats.overdueCount}</p>
              <p className={`text-xs ${
                stats.overdueCount > 0 ? 'text-red-600' : 'text-slate-500'
              }`}>Przeterminowane</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Alerts — upcoming + overdue deadlines */}
        <div className="lg:col-span-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
            <CalendarClock className="h-5 w-5 text-slate-400" />
            Nadchodzące terminy
          </h2>

          {stats.upcomingDeadlines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">Brak nadchodzących terminów.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.upcomingDeadlines.map((d) => {
                const urgency = getUrgencyClasses(d.due_date)
                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/zasoby/${d.asset_id}`)}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:shadow-sm ${urgency.bg}`}
                  >
                    <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${urgency.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                        <span className="shrink-0 text-xs text-slate-500">{d.asset_name}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(d.due_date).toLocaleDateString('pl-PL')} &middot; {formatDaysLabel(d.due_date)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
            <Clock className="h-5 w-5 text-slate-400" />
            Ostatnia aktywność
          </h2>

          {stats.recentActivity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
              <p className="text-sm text-slate-500">Brak aktywności.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-200 bg-white p-3"
                >
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{actionLabels[entry.action] ?? entry.action}</span>
                    {' '}
                    <span className="text-slate-500">{tableLabels[entry.table_name] ?? entry.table_name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleString('pl-PL')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
