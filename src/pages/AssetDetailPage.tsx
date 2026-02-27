import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, CalendarClock, Wrench, Gauge, Shield, X } from 'lucide-react'
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
import DeadlineFormModal from '../components/DeadlineFormModal'
import { Skeleton } from '../components/Skeleton'
import { useAssetGuardians, useAllUsers } from '../hooks/useAssetGuardians'
import type { Deadline, ServiceEntry } from '../types/database'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { asset, loading, error, refetch: refetchAsset } = useAsset(id)
  const { entries, loading: entriesLoading, refetch: refetchEntries } = useServiceEntries(id)
  const { deadlines, loading: deadlinesLoading, refetch: refetchDeadlines } = useDeadlines(id)

  const { guardians, setGuardian, removeGuardian } = useAssetGuardians(id)
  const allUsers = useAllUsers()

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
      <div className="mx-auto max-w-4xl">
        <Skeleton className="h-4 w-16 mb-4" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
          ))}
        </div>
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{asset.name}</h1>
            <AssetTypeBadge type={asset.type} />
            <button
              onClick={() => setShowAssetModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edytuj
            </button>
          </div>
          <p className="mt-1 font-mono text-sm text-slate-500">{asset.identifier}</p>
          {asset.current_mileage != null && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-sm font-medium text-slate-700">
              <Gauge className="h-4 w-4 text-slate-500" />
              Aktualny przebieg: {asset.current_mileage.toLocaleString('pl-PL')} km
            </div>
          )}
          {asset.notes && (
            <p className="mt-2 text-sm text-slate-600">{asset.notes}</p>
          )}
        </div>

        {/* Guardians - compact panel on the right */}
        <div className="w-full lg:w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-2">
            <Shield className="h-3 w-3" />
            Opiekunowie
          </h3>
          <div className="space-y-1.5">
            {[1, 2, 3].map((pos) => {
              const guardian = guardians.find((g) => g.position === pos)
              const assignedUserIds = guardians.map((g) => g.user_id)
              return (
                <div key={pos} className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-300 w-3 shrink-0">{pos}.</span>
                  {guardian ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <span className="text-xs text-slate-700 truncate">{guardian.user_name}</span>
                      <button
                        onClick={() => removeGuardian(pos)}
                        className="ml-auto shrink-0 rounded-md p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) setGuardian(pos, e.target.value) }}
                      className="flex-1 rounded border border-dashed border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-400 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="">Wybierz...</option>
                      {allUsers
                        .filter((u) => !assignedUserIds.includes(u.id))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))
                      }
                    </select>
                  )}
                </div>
              )
            })}
          </div>
        </div>
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
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ))}
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
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="mt-2 h-3 w-28" />
              </div>
            ))}
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
        <DeadlineFormModal
          assetId={asset.id}
          deadline={editingDeadline}
          onClose={() => setEditingDeadline(undefined)}
          onSaved={refetchDeadlines}
        />
      )}
    </div>
  )
}
