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
    <div className="relative border-l-2 border-slate-200 pl-6 pb-6 last:pb-0">
      {/* Timeline dot */}
      <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-slate-300" />

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">
                {new Date(entry.date).toLocaleDateString('pl-PL')}
              </span>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
              {entry.priority && (
                <span className="text-xs text-slate-400">
                  Priorytet: {entry.priority}/5
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-slate-900">{entry.description}</p>
            {entry.mileage != null && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                <Gauge className="h-3 w-3" />
                {entry.mileage.toLocaleString('pl-PL')} km
              </p>
            )}
            {entry.notes && (
              <p className="mt-1.5 text-xs text-slate-500 italic">{entry.notes}</p>
            )}
          </div>
          <button
            onClick={() => onEdit(entry)}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
