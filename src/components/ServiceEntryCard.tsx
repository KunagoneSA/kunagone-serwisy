import { Pencil, Gauge } from 'lucide-react'
import type { ServiceEntry, ServiceStatus } from '../types/database'

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  done: { label: 'Wykonane', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pending: { label: 'Do zrobienia', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  waiting: { label: 'Oczekuje', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  external: { label: 'Zewnętrznie', className: 'bg-violet-100 text-violet-700 border-violet-200' },
  postponed: { label: 'Przełożone', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

interface ServiceEntryCardProps {
  entry: ServiceEntry
  onEdit: (entry: ServiceEntry) => void
}

export default function ServiceEntryCard({ entry, onEdit }: ServiceEntryCardProps) {
  const status = statusConfig[entry.status]

  return (
    <div className="relative border-l-2 border-slate-200 pl-4 pb-3 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute -left-[5px] top-0.5 h-2 w-2 rounded-full bg-slate-300" />

      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">
              {new Date(entry.date).toLocaleDateString('pl-PL')}
            </span>
            <span className={`inline-flex rounded border px-1.5 py-px text-[10px] font-medium ${status.className}`}>
              {status.label}
            </span>
            {entry.mileage != null && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                <Gauge className="h-2.5 w-2.5" />
                {entry.mileage.toLocaleString('pl-PL')} km
              </span>
            )}
            {entry.priority && (
              <span className="text-[10px] text-slate-300">P{entry.priority}</span>
            )}
          </div>
          <p className="text-xs text-slate-900 leading-snug">{entry.description}</p>
          {entry.notes && (
            <p className="text-[11px] text-slate-400 italic truncate">{entry.notes}</p>
          )}
        </div>
        <button
          onClick={() => onEdit(entry)}
          className="shrink-0 rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
