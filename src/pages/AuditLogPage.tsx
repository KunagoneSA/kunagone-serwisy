import { useState } from 'react'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import { useAuditLog } from '../hooks/useAuditLog'

const actionLabels: Record<string, { label: string; className: string }> = {
  insert: { label: 'Dodano', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  update: { label: 'Zaktualizowano', className: 'bg-blue-100 text-blue-700 border-blue-200' },
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

  // Filter out noisy fields
  const skipKeys = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by'])
  const changedKeys = Array.from(allKeys).filter((key) => {
    if (skipKeys.has(key)) return false
    const oldVal = JSON.stringify(oldData?.[key] ?? null)
    const newVal = JSON.stringify(newData?.[key] ?? null)
    return oldVal !== newVal
  })

  if (changedKeys.length === 0) return null

  return (
    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs font-mono space-y-1">
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

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { entries, loading, loadingMore, hasMore, error, loadMore } = useAuditLog({
    tableFilter: tableFilter || null,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historia zmian</h1>
      <p className="mt-1 text-sm text-slate-500">Rejestr wszystkich operacji w systemie.</p>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          >
            {tableFilterOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Od</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Do</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && entries.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <History className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900">Brak wpisów</p>
          <p className="mt-1 text-sm text-slate-500">Historia zmian pojawi się po pierwszych operacjach.</p>
        </div>
      )}

      {/* Entries list */}
      {!loading && entries.length > 0 && (
        <div className="mt-6 space-y-2">
          {entries.map((entry) => {
            const action = actionLabels[entry.action] ?? { label: entry.action, className: 'bg-slate-100 text-slate-700 border-slate-200' }
            const isExpanded = expandedId === entry.id
            const hasChanges = entry.action === 'update' && (entry.old_data || entry.new_data)

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white"
              >
                <div
                  className={`flex items-center gap-3 p-4 ${hasChanges ? 'cursor-pointer' : ''}`}
                  onClick={() => hasChanges && setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${action.className}`}
                      >
                        {action.label}
                      </span>
                      <span className="text-sm text-slate-700">
                        {tableLabels[entry.table_name] ?? entry.table_name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleString('pl-PL')}
                      <span className="mx-1">&middot;</span>
                      <span className="font-mono">{entry.record_id.slice(0, 8)}</span>
                    </p>
                  </div>
                  {hasChanges && (
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  )}
                </div>

                {isExpanded && hasChanges && (
                  <div className="border-t border-slate-100 px-4 pb-4">
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
                className="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
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
