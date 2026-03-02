import { CalendarPlus, Check, Pencil, Gauge } from 'lucide-react'
import type { Deadline, DeadlineType } from '../types/database'

const typeLabels: Record<DeadlineType, string> = {
  insurance: 'Ubezpieczenie',
  inspection: 'Przegląd',
  homologation: 'Homologacja',
  service: 'Serwis',
  other: 'Inne',
}

const typeColors: Record<DeadlineType, string> = {
  insurance: 'bg-sky-100 text-sky-700 border-sky-200',
  inspection: 'bg-orange-100 text-orange-700 border-orange-200',
  homologation: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  service: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
}

function getUrgencyColor(deadline: Deadline): string {
  if (deadline.completed) return 'border-l-slate-300'
  if (!deadline.due_date) return 'border-l-blue-400'
  const days = Math.ceil(
    (new Date(deadline.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days <= 7) return 'border-l-red-500'
  if (days <= 30) return 'border-l-amber-400'
  if (days <= 90) return 'border-l-emerald-400'
  return 'border-l-slate-300'
}

function formatDaysRemaining(dueDate: string): string {
  const days = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days < 0) return `${Math.abs(days)} dni po terminie`
  if (days === 0) return 'Dzisiaj'
  if (days === 1) return 'Jutro'
  return `za ${days} dni`
}

function buildCalendarUrl(deadline: Deadline, assetName?: string): string | null {
  if (!deadline.due_date) return null
  const date = deadline.due_date.replace(/-/g, '')
  const title = encodeURIComponent(`${deadline.title}${assetName ? ` - ${assetName}` : ''}`)
  const details = encodeURIComponent(`Typ: ${typeLabels[deadline.type]}`)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}/${date}&details=${details}`
}

interface DeadlineCardProps {
  deadline: Deadline
  assetName?: string
  onMarkDone: (deadline: Deadline) => void
  onEdit: (deadline: Deadline) => void
}

export default function DeadlineCard({ deadline, assetName, onMarkDone, onEdit }: DeadlineCardProps) {
  const urgencyColor = getUrgencyColor(deadline)
  const calendarUrl = buildCalendarUrl(deadline, assetName)

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-200 border-l-4 bg-white px-3 py-2 ${urgencyColor} ${
        deadline.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex rounded border px-1.5 py-px text-[10px] font-medium ${typeColors[deadline.type]}`}>
            {typeLabels[deadline.type]}
          </span>
          <span className="text-xs font-medium text-slate-900">{deadline.title}</span>
          {deadline.completed && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
              <Check className="h-3 w-3" /> Wykonane
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
          {deadline.due_date && (
            <>
              <span>{new Date(deadline.due_date).toLocaleDateString('pl-PL')}</span>
              {!deadline.completed && (
                <span className="font-medium">{formatDaysRemaining(deadline.due_date)}</span>
              )}
            </>
          )}
          {deadline.due_mileage != null && (
            <span className="inline-flex items-center gap-0.5 font-medium text-blue-600">
              <Gauge className="h-2.5 w-2.5" />
              {deadline.due_mileage.toLocaleString('pl-PL')} km
            </span>
          )}
          {deadline.is_recurring && deadline.recurrence_rule && (
            <span className="text-slate-300">{deadline.recurrence_rule}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {!deadline.completed && (
          <button
            onClick={() => onMarkDone(deadline)}
            title="Oznacz jako wykonane"
            className="rounded-md p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        {calendarUrl && (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Dodaj do Google Calendar"
            className="rounded-md p-1 text-slate-300 hover:bg-blue-50 hover:text-blue-600"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          onClick={() => onEdit(deadline)}
          title="Edytuj"
          className="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
