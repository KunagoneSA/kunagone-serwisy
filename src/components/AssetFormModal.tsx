import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Asset, AssetType } from '../types/database'

interface AssetFormModalProps {
  asset?: Asset | null
  onClose: () => void
  onSaved: () => void
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'vehicle', label: 'Pojazd' },
  { value: 'equipment', label: 'Sprzęt' },
  { value: 'infrastructure', label: 'Infrastruktura' },
]

export default function AssetFormModal({ asset, onClose, onSaved }: AssetFormModalProps) {
  const { user } = useAuth()
  const isEdit = !!asset

  const [name, setName] = useState(asset?.name ?? '')
  const [identifier, setIdentifier] = useState(asset?.identifier ?? '')
  const [type, setType] = useState<AssetType>(asset?.type ?? 'vehicle')
  const [currentMileage, setCurrentMileage] = useState(asset?.current_mileage?.toString() ?? '')
  const [notes, setNotes] = useState(asset?.notes ?? '')
  const [metadata, setMetadata] = useState<[string, string][]>(
    asset?.metadata ? Object.entries(asset.metadata) : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMetadataRow = () => setMetadata([...metadata, ['', '']])

  const updateMetadataKey = (index: number, key: string) => {
    const updated = [...metadata]
    updated[index] = [key, updated[index][1]]
    setMetadata(updated)
  }

  const updateMetadataValue = (index: number, value: string) => {
    const updated = [...metadata]
    updated[index] = [updated[index][0], value]
    setMetadata(updated)
  }

  const removeMetadataRow = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const metadataObj = Object.fromEntries(metadata.filter(([k]) => k.trim() !== ''))

    try {
      const mileageValue = currentMileage ? parseInt(currentMileage, 10) : null

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('assets')
          .update({ name, identifier, type, notes: notes || null, metadata: metadataObj, current_mileage: mileageValue })
          .eq('id', asset.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('assets')
          .insert({ name, identifier, type, notes: notes || null, metadata: metadataObj, current_mileage: mileageValue, created_by: user?.id ?? null })

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edytuj zasób' : 'Nowy zasób'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nazwa *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Dacia Logan"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Identyfikator *</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="np. KOS 71687"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Typ</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            >
              {assetTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aktualny przebieg (km)</label>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={currentMileage}
              onChange={(e) => setCurrentMileage(e.target.value)}
              placeholder="np. 125000"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notatki</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notatki stałe, np. &quot;nie zamawiać filtra kabinowego&quot;"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>

          {/* Dynamic metadata */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">Dane dodatkowe</label>
              <button
                type="button"
                onClick={addMetadataRow}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Dodaj pole
              </button>
            </div>
            {metadata.length === 0 && (
              <p className="text-xs text-slate-400">np. Typ oleju, Nr filtra, Pojemność zbiornika</p>
            )}
            <div className="space-y-2">
              {metadata.map(([key, value], index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => updateMetadataKey(index, e.target.value)}
                    placeholder="Klucz"
                    className="w-1/3 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateMetadataValue(index, e.target.value)}
                    placeholder="Wartość"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetadataRow(index)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              {saving ? 'Zapisywanie...' : isEdit ? 'Zapisz zmiany' : 'Dodaj zasób'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
