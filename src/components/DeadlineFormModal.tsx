import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Deadline, DeadlineType } from '../types/database'

interface DeadlineFormModalProps {
  assetId: string
  deadline?: Deadline | null
  onClose: () => void
  onSaved: () => void
}

const typeOptions: { value: DeadlineType; label: string }[] = [
  { value: 'insurance', label: 'Ubezpieczenie' },
  { value: 'inspection', label: 'Przegląd' },
  { value: 'homologation', label: 'Homologacja' },
  { value: 'service', label: 'Serwis' },
  { value: 'other', label: 'Inne' },
]

type TriggerMode = 'date' | 'mileage' | 'both'

function getInitialMode(deadline?: Deadline | null): TriggerMode {
  if (!deadline) return 'date'
  const hasDate = !!deadline.due_date
  const hasMileage = !!deadline.due_mileage
  if (hasDate && hasMileage) return 'both'
  if (hasMileage) return 'mileage'
  return 'date'
}

const notifyDaysOptions = [30, 14, 7, 1] as const

export default function DeadlineFormModal({ assetId, deadline, onClose, onSaved }: DeadlineFormModalProps) {
  const { user } = useAuth()
  const isEdit = !!deadline

  const [type, setType] = useState<DeadlineType>(deadline?.type ?? 'inspection')
  const [title, setTitle] = useState(deadline?.title ?? '')
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(getInitialMode(deadline))
  const [dueDate, setDueDate] = useState(deadline?.due_date ?? '')
  const [dueMileage, setDueMileage] = useState(deadline?.due_mileage?.toString() ?? '')
  const [isRecurring, setIsRecurring] = useState(deadline?.is_recurring ?? false)
  const [recurrenceRule, setRecurrenceRule] = useState(deadline?.recurrence_rule ?? '')
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number[]>(
    deadline?.notify_days_before ?? [30, 14, 7, 1]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showDate = triggerMode === 'date' || triggerMode === 'both'
  const showMileage = triggerMode === 'mileage' || triggerMode === 'both'

  const toggleNotifyDay = (day: number) => {
    setNotifyDaysBefore((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => b - a)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      asset_id: assetId,
      type,
      title,
      due_date: showDate && dueDate ? dueDate : null,
      due_mileage: showMileage && dueMileage ? parseInt(dueMileage, 10) : null,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule || null : null,
      notify_days_before: notifyDaysBefore,
    }

    if (!payload.due_date && !payload.due_mileage) {
      setError('Podaj datę lub przebieg')
      setSaving(false)
      return
    }

    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('deadlines')
          .update(payload)
          .eq('id', deadline.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('deadlines')
          .insert({ ...payload, created_by: user?.id ?? null })

        if (insertError) throw insertError
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-center bg-black/50 sm:overflow-y-auto sm:p-4 sm:pt-[10vh]" onClick={onClose}>
      <div
        className="w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:max-w-lg sm:rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edytuj termin' : 'Nowy termin'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DeadlineType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                {typeOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Wyzwalacz</label>
              <select
                value={triggerMode}
                onChange={(e) => setTriggerMode(e.target.value as TriggerMode)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="date">Data</option>
                <option value="mileage">Przebieg</option>
                <option value="both">Data + Przebieg</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tytuł *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Wymiana oleju, Przegląd techniczny"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {/* Date and/or mileage fields */}
          <div className={`grid gap-4 ${showDate && showMileage ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {showDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Termin (data) {!showMileage && '*'}</label>
                <input
                  type="date"
                  required={!showMileage}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            )}
            {showMileage && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Przy przebiegu (km) {!showDate && '*'}</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  required={!showDate}
                  value={dueMileage}
                  onChange={(e) => setDueMileage(e.target.value)}
                  placeholder="np. 150000"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            )}
          </div>

          {/* Recurring toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  isRecurring ? 'bg-amber-500' : 'bg-slate-200'
                }`}
                onClick={() => setIsRecurring(!isRecurring)}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    isRecurring ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-sm font-medium text-slate-700">Cykliczny</span>
            </label>
            {isRecurring && (
              <input
                type="text"
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="np. co 12 miesięcy, co 15000 km"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            )}
          </div>

          {/* Notification days - only for date-based deadlines */}
          {showDate && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Powiadomienia (dni przed terminem)</label>
              <div className="flex gap-2 flex-wrap">
                {notifyDaysOptions.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleNotifyDay(day)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      notifyDaysBefore.includes(day)
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {day} {day === 1 ? 'dzień' : 'dni'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj termin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
