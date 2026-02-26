import { useState } from 'react'
import { ChevronDown, ChevronUp, History, User } from 'lucide-react'
import { useAuditLog, useAuditUsers } from '../hooks/useAuditLog'
import { Skeleton } from '../components/Skeleton'

const actionLabels: Record<string, { label: string; className: string }> = {
  insert: { label: 'Dodano', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  update: { label: 'Zmieniono', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  delete: { label: 'Usunięto', className: 'bg-red-100 text-red-700 border-red-200' },
}

const tableLabels: Record<string, string> = {
  assets: 'Zasób',
  service_entries: 'Wpis serwisowy',
  deadlines: 'Termin',
}

const tableFilterOptions = [
  { value: '', label: 'Wszystkie' },
  { value: 'assets', label: 'Zasoby' },
  { value: 'service_entries', label: 'Wpisy serwisowe' },
  { value: 'deadlines', label: 'Terminy' },
]

function DiffView({ oldData, newData }: { oldData: Record<string, unknown> | null; newData: Record<string, unknown> | null }) {
  if (!oldData && !newData) return null

  const allKeys = new Set([
    ...Object.keys(oldData ?? {}),
    ...Object.keys(newData ?? {}),
  ])

  const skipKeys = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by'])
  const changedKeys = Array.from(allKeys).filter((key) => {
    if (skipKeys.has(key)) return false
    const oldVal = JSON.stringify(oldData?.[key] ?? null)
    const newVal = JSON.stringify(newData?.[key] ?? null)
    return oldVal !== newVal
  })

  if (changedKeys.length === 0) return null

  return (
    <div className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs font-mono space-y-0.5">
      {changedKeys.map((key) => {
        const oldVal = oldData?.[key]
        const newVal = newData?.[key]
        return (
          <div key={key} className="flex gap-2">
            <span className="text-slate-500 shrink-0">{key}:</span>
            {oldData && (
              <span className="text-red-600 line-through">
                {typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal ?? '')}
              </span>
            )}
            {newData && (
              <span className="text-emerald-700">
                {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? '')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function emailLabel(email: string | null) {
  if (!email) return 'system'
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { entries, loading, loadingMore, hasMore, error, loadMore } = useAuditLog({
    tableFilter: tableFilter || null,
    userFilter: userFilter || null,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const auditUsers = useAuditUsers()

  const selectClass = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20'
  const inputClass = selectClass

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historia zmian</h1>
      <p className="mt-1 text-sm text-slate-500">Rejestr wszystkich operacji w systemie.</p>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:flex-wrap">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
          <select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} className={selectClass}>
            {tableFilterOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Użytkownik</label>
          <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className={selectClass}>
            <option value="">Wszyscy</option>
            {auditUsers.map((u) => (
              <option key={u.user_id} value={u.user_id}>{u.user_email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Od</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Do</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-5 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-18 rounded-md" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && entries.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <History className="h-6 w-6 text-slate-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900">Brak wpisów</p>
          <p className="mt-1 text-sm text-slate-500">Historia zmian pojawi się po pierwszych operacjach.</p>
        </div>
      )}

      {/* Entries list */}
      {!loading && entries.length > 0 && (
        <div className="mt-5 space-y-1">
          {entries.map((entry) => {
            const action = actionLabels[entry.action] ?? { label: entry.action, className: 'bg-slate-100 text-slate-700 border-slate-200' }
            const isExpanded = expandedId === entry.id
            const hasChanges = entry.action === 'update' && (entry.old_data || entry.new_data)

            return (
              <div
                key={entry.id}
                className="rounded-lg border border-slate-200 bg-white"
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 ${hasChanges ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  onClick={() => hasChanges && setExpandedId(isExpanded ? null : entry.id)}
                >
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-none ${action.className}`}
                  >
                    {action.label}
                  </span>
                  <span className="text-sm text-slate-700 truncate">
                    {tableLabels[entry.table_name] ?? entry.table_name}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 shrink-0">
                    <User className="h-3 w-3" />
                    {emailLabel(entry.user_email)}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-400 tabular-nums shrink-0">
                    {new Date(entry.created_at).toLocaleString('pl-PL', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {hasChanges && (
                    <div className="text-slate-300">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </div>
                  )}
                </div>
                {/* Mobile user row */}
                <div className="sm:hidden px-3 pb-1.5 -mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  {emailLabel(entry.user_email)}
                </div>

                {isExpanded && hasChanges && (
                  <div className="border-t border-slate-100 px-3 pb-2">
                    <DiffView oldData={entry.old_data} newData={entry.new_data} />
                  </div>
                )}
              </div>
            )
          })}

          {/* Load more */}
          {hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-slate-200 bg-white px-6 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {loadingMore ? 'Ładowanie...' : 'Załaduj więcej'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
