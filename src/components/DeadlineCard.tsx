import { CalendarPlus, Check, Pencil } from 'lucide-react'
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

function getUrgencyColor(dueDate: string, completed: boolean): string {
  if (completed) return 'border-l-slate-300'
  const days = Math.ceil(
    (new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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

function buildCalendarUrl(deadline: Deadline, assetName?: string): string {
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
  const urgencyColor = getUrgencyColor(deadline.due_date, deadline.completed)

  return (
    <div
      className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 ${urgencyColor} ${
        deadline.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${typeColors[deadline.type]}`}
            >
              {typeLabels[deadline.type]}
            </span>
            {deadline.completed && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Check className="h-3 w-3" /> Wykonane
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium text-slate-900">{deadline.title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
            <span>{new Date(deadline.due_date).toLocaleDateString('pl-PL')}</span>
            {!deadline.completed && (
              <span className="font-medium">
                {formatDaysRemaining(deadline.due_date)}
              </span>
            )}
            {deadline.is_recurring && deadline.recurrence_rule && (
              <span className="text-slate-400">{deadline.recurrence_rule}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!deadline.completed && (
            <button
              onClick={() => onMarkDone(deadline)}
              title="Oznacz jako wykonane"
              className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <a
            href={buildCalendarUrl(deadline, assetName)}
            target="_blank"
            rel="noopener noreferrer"
            title="Dodaj do Google Calendar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
          >
            <CalendarPlus className="h-4 w-4" />
          </a>
          <button
            onClick={() => onEdit(deadline)}
            title="Edytuj"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
