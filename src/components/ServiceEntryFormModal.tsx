import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { ServiceEntry, ServiceStatus } from '../types/database'

interface ServiceEntryFormModalProps {
  assetId: string
  entry?: ServiceEntry | null
  onClose: () => void
  onSaved: () => void
}

const statusOptions: { value: ServiceStatus; label: string }[] = [
  { value: 'done', label: 'Wykonane' },
  { value: 'pending', label: 'Do zrobienia' },
  { value: 'waiting', label: 'Oczekuje' },
  { value: 'external', label: 'Zewnętrznie' },
  { value: 'postponed', label: 'Przełożone' },
]

export default function ServiceEntryFormModal({ assetId, entry, onClose, onSaved }: ServiceEntryFormModalProps) {
  const { user } = useAuth()
  const isEdit = !!entry

  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(entry?.description ?? '')
  const [status, setStatus] = useState<ServiceStatus>(entry?.status ?? 'done')
  const [mileage, setMileage] = useState(entry?.mileage?.toString() ?? '')
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [priority, setPriority] = useState(entry?.priority?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      asset_id: assetId,
      date,
      description,
      status,
      mileage: mileage ? parseInt(mileage, 10) : null,
      notes: notes || null,
      priority: priority ? parseInt(priority, 10) : null,
    }

    try {
      if (isEdit) {
        const { error: updateError } = await supabase
          .from('service_entries')
          .update({ ...payload, updated_by: user?.id ?? null })
          .eq('id', entry.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('service_entries')
          .insert({ ...payload, created_by: user?.id ?? null })

        if (insertError) throw insertError
      }

      // Update asset's current_mileage if mileage was provided
      if (payload.mileage) {
        await supabase
          .from('assets')
          .update({ current_mileage: payload.mileage })
          .eq('id', assetId)
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
            {isEdit ? 'Edytuj wpis serwisowy' : 'Nowy wpis serwisowy'}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                {statusOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Opis *</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Co zostało zrobione lub co trzeba zrobić..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Przebieg (km)</label>
              <input
                type="number"
                min="0"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder="np. 125000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priorytet</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              >
                <option value="">Brak</option>
                <option value="1">1 - Najniższy</option>
                <option value="2">2 - Niski</option>
                <option value="3">3 - Średni</option>
                <option value="4">4 - Wysoki</option>
                <option value="5">5 - Krytyczny</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notatki</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Użyte części, koszty, uwagi..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

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
              {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj wpis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
