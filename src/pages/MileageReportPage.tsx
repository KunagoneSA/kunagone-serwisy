import { useState, useEffect, useRef } from 'react'
import { Camera, Check, Gauge, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface AssetOption {
  id: string
  name: string
  identifier: string
  current_mileage: number | null
}

export default function MileageReportPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [assets, setAssets] = useState<AssetOption[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [mileage, setMileage] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('assets')
      .select('id, name, identifier, current_mileage')
      .eq('type', 'vehicle')
      .order('name')
      .then(({ data }) => {
        if (data) setAssets(data)
      })
  }, [])

  const selectedAsset = assets.find((a) => a.id === selectedAssetId)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !mileage) return

    const mileageNum = parseInt(mileage, 10)
    if (isNaN(mileageNum) || mileageNum <= 0) {
      setError('Podaj prawidłowy przebieg')
      return
    }

    if (selectedAsset?.current_mileage != null && mileageNum < selectedAsset.current_mileage) {
      setError(`Przebieg nie może być mniejszy niż aktualny (${selectedAsset.current_mileage.toLocaleString('pl-PL')} km)`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      let photoPath: string | null = null

      if (photo) {
        const ext = photo.name.split('.').pop() || 'jpg'
        const fileName = `${selectedAssetId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('mileage-photos')
          .upload(fileName, photo, { contentType: photo.type })
        if (uploadError) throw uploadError
        photoPath = fileName
      }

      // Insert mileage report
      const { error: insertError } = await supabase
        .from('mileage_reports')
        .insert({
          asset_id: selectedAssetId,
          mileage: mileageNum,
          photo_path: photoPath,
          notes: notes || null,
          reported_by: user?.id ?? null,
        })
      if (insertError) throw insertError

      // Update asset current_mileage
      const { error: updateError } = await supabase
        .from('assets')
        .update({ current_mileage: mileageNum })
        .eq('id', selectedAssetId)
      if (updateError) throw updateError

      setSuccess(true)
      setMileage('')
      setNotes('')
      setPhoto(null)
      setPhotoPreview(null)
      setSelectedAssetId('')

      // Refresh assets to get updated mileage
      const { data } = await supabase
        .from('assets')
        .select('id, name, identifier, current_mileage')
        .eq('type', 'vehicle')
        .order('name')
      if (data) setAssets(data)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd zapisu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Zgłoś przebieg</h1>
      <p className="mt-1 text-sm text-slate-500">Wybierz pojazd, wpisz przebieg lub zrób zdjęcie licznika.</p>

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <Check className="h-4 w-4" />
          Przebieg zapisany!
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Asset selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Pojazd</label>
          <div className="relative">
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              required
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            >
              <option value="">Wybierz pojazd...</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.identifier}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          {selectedAsset?.current_mileage != null && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              <Gauge className="h-3 w-3" />
              Aktualny przebieg: {selectedAsset.current_mileage.toLocaleString('pl-PL')} km
            </p>
          )}
        </div>

        {/* Mileage input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Przebieg (km)</label>
          <div className="relative">
            <Gauge className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              required
              placeholder="np. 45230"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-lg font-semibold text-slate-900 placeholder:text-slate-300 placeholder:font-normal focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        {/* Photo capture */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Zdjęcie licznika (opcjonalne)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Podgląd zdjęcia"
                className="w-full rounded-xl border border-slate-200 object-cover max-h-48"
              />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                className="absolute top-2 right-2 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-medium text-white hover:bg-black/70"
              >
                Usuń
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-6 text-sm font-medium text-slate-500 transition-colors hover:border-amber-300 hover:bg-amber-50/30 hover:text-amber-700"
            >
              <Camera className="h-5 w-5" />
              Zrób zdjęcie lub wybierz z galerii
            </button>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Uwagi (opcjonalne)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="np. tankowanie, wyjazd służbowy..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !selectedAssetId || !mileage}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Zapisywanie...' : 'Zapisz przebieg'}
        </button>
      </form>
    </div>
  )
}
