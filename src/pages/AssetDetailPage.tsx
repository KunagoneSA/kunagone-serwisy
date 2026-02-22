import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, CalendarClock, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useAsset } from '../hooks/useAsset'
import { useServiceEntries } from '../hooks/useServiceEntries'
import { useDeadlines } from '../hooks/useDeadlines'
import AssetTypeBadge from '../components/AssetTypeBadge'
import AssetFormModal from '../components/AssetFormModal'
import DeadlineCard from '../components/DeadlineCard'
import ServiceEntryCard from '../components/ServiceEntryCard'
import ServiceEntryFormModal from '../components/ServiceEntryFormModal'
import type { Deadline, ServiceEntry } from '../types/database'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { asset, loading, error, refetch: refetchAsset } = useAsset(id)
  const { entries, loading: entriesLoading, refetch: refetchEntries } = useServiceEntries(id)
  const { deadlines, loading: deadlinesLoading, refetch: refetchDeadlines } = useDeadlines(id)

  const [showAssetModal, setShowAssetModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ServiceEntry | null | undefined>(undefined)
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null | undefined>(undefined)

  const handleMarkDone = async (deadline: Deadline) => {
    await supabase
      .from('deadlines')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        completed_by: user?.id ?? null,
      })
      .eq('id', deadline.id)
    refetchDeadlines()
  }

  if (loading) {
    return (
      <div className="flex justify-center pt-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="text-center pt-12">
        <p className="text-sm text-red-600">{error ?? 'Nie znaleziono zasobu'}</p>
        <button
          onClick={() => navigate('/zasoby')}
          className="mt-4 text-sm text-amber-600 hover:text-amber-700"
        >
          Wróć do listy zasobów
        </button>
      </div>
    )
  }

  const metadataEntries = asset.metadata ? Object.entries(asset.metadata) : []

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back + header */}
      <button
        onClick={() => navigate('/zasoby')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zasoby
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
            <AssetTypeBadge type={asset.type} />
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">{asset.identifier}</p>
          {asset.notes && (
            <p className="mt-2 text-sm text-slate-600">{asset.notes}</p>
          )}
        </div>
        <button
          onClick={() => setShowAssetModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
          Edytuj
        </button>
      </div>

      {/* Metadata */}
      {metadataEntries.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">Dane dodatkowe</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {metadataEntries.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-slate-400">{key}</dt>
                <dd className="text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deadlines section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CalendarClock className="h-5 w-5 text-slate-400" />
            Terminy
          </h2>
          <button
            onClick={() => setEditingDeadline(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Dodaj termin
          </button>
        </div>

        {deadlinesLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
          </div>
        ) : deadlines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <p className="text-sm text-slate-500">Brak terminów. Dodaj pierwszy termin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <DeadlineCard
                key={d.id}
                deadline={d}
                assetName={asset.name}
                onMarkDone={handleMarkDone}
                onEdit={(dl) => setEditingDeadline(dl)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Service history section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Wrench className="h-5 w-5 text-slate-400" />
            Historia serwisów
          </h2>
          <button
            onClick={() => setEditingEntry(null)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Dodaj wpis
          </button>
        </div>

        {entriesLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <p className="text-sm text-slate-500">Brak wpisów serwisowych. Dodaj pierwszy wpis.</p>
          </div>
        ) : (
          <div className="ml-1">
            {entries.map((entry) => (
              <ServiceEntryCard
                key={entry.id}
                entry={entry}
                onEdit={(e) => setEditingEntry(e)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAssetModal && (
        <AssetFormModal
          asset={asset}
          onClose={() => setShowAssetModal(false)}
          onSaved={() => { refetchAsset(); setShowAssetModal(false) }}
        />
      )}

      {editingEntry !== undefined && (
        <ServiceEntryFormModal
          assetId={asset.id}
          entry={editingEntry}
          onClose={() => setEditingEntry(undefined)}
          onSaved={refetchEntries}
        />
      )}

      {editingDeadline !== undefined && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditingDeadline(undefined)}
        >
          <div className="rounded-xl bg-white p-6 text-sm text-slate-600" onClick={(e) => e.stopPropagation()}>
            Formularz terminu (wkrótce)
            <button onClick={() => setEditingDeadline(undefined)} className="ml-4 text-amber-600">Zamknij</button>
          </div>
        </div>
      )}
    </div>
  )
}
