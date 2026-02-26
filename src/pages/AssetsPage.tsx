import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Calendar, Wrench, Pencil, Gauge } from 'lucide-react'
import { useAssets } from '../hooks/useAssets'
import AssetTypeBadge from '../components/AssetTypeBadge'
import AssetFormModal from '../components/AssetFormModal'
import { TableSkeleton, CardSkeleton } from '../components/Skeleton'
import type { Asset, AssetType } from '../types/database'

const typeFilters: { label: string; value: AssetType | null }[] = [
  { label: 'Wszystkie', value: null },
  { label: 'Pojazdy', value: 'vehicle' },
  { label: 'Sprzęt', value: 'equipment' },
  { label: 'Infrastruktura', value: 'infrastructure' },
]

export default function AssetsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<AssetType | null>(null)
  const [modalAsset, setModalAsset] = useState<Asset | null | undefined>(undefined)
  const { assets, loading, error, refetch } = useAssets({ search, typeFilter })

  const openCreate = () => setModalAsset(null)
  const openEdit = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation()
    setModalAsset(asset)
  }
  const closeModal = () => setModalAsset(undefined)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Zasoby</h1>
          <p className="mt-1 text-sm text-slate-500">Pojazdy, sprzęt i infrastruktura.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors hover:bg-amber-400 active:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Dodaj zasób
        </button>
      </div>

      {/* Search + filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Szukaj po nazwie lub identyfikatorze..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {typeFilters.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setTypeFilter(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <>
          <div className="mt-6 hidden md:block">
            <TableSkeleton rows={5} />
          </div>
          <div className="mt-6 space-y-3 md:hidden">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && assets.length === 0 && (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Wrench className="h-7 w-7 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-900">Brak zasobów</p>
          <p className="mt-1 text-sm text-slate-500">Dodaj pierwszy zasób, aby rozpocząć.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Dodaj zasób
          </button>
        </div>
      )}

      {/* Desktop table */}
      {!loading && !error && assets.length > 0 && (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Nazwa</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Identyfikator</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Typ</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Przebieg</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Następny termin</th>
                  <th className="px-3 py-1.5 text-left font-medium text-slate-500">Ostatni serwis</th>
                  <th className="w-8 px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => navigate(`/zasoby/${asset.id}`)}
                    className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/80 last:border-0"
                  >
                    <td className="px-3 py-1 font-medium text-slate-900">{asset.name}</td>
                    <td className="px-3 py-1 font-mono text-xs text-slate-600">{asset.identifier}</td>
                    <td className="px-3 py-1">
                      <AssetTypeBadge type={asset.type} />
                    </td>
                    <td className="px-3 py-1 text-slate-600">
                      {asset.current_mileage != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-slate-400" />
                          {asset.current_mileage.toLocaleString('pl-PL')} km
                        </span>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-3 py-1 text-slate-600">
                      <div className="flex flex-col">
                        {asset.next_deadline_date ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(asset.next_deadline_date).toLocaleDateString('pl-PL')}
                          </span>
                        ) : null}
                        {asset.next_deadline_mileage != null ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                            <Gauge className="h-3 w-3" />
                            {asset.next_deadline_mileage.toLocaleString('pl-PL')} km
                          </span>
                        ) : null}
                        {!asset.next_deadline_date && asset.next_deadline_mileage == null && (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1 text-slate-600">
                      {asset.last_service_date ? (
                        new Date(asset.last_service_date).toLocaleDateString('pl-PL')
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={(e) => openEdit(asset, e)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-6 space-y-2 md:hidden">
            {assets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => navigate(`/zasoby/${asset.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition-colors active:bg-slate-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{asset.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{asset.identifier}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AssetTypeBadge type={asset.type} />
                    <button
                      onClick={(e) => openEdit(asset, e)}
                      className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {asset.current_mileage != null && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    <Gauge className="h-3 w-3" />
                    {asset.current_mileage.toLocaleString('pl-PL')} km
                  </div>
                )}
                <div className="mt-2 flex gap-4 text-xs text-slate-500">
                  {asset.next_deadline_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(asset.next_deadline_date).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                  {asset.last_service_date && (
                    <span className="inline-flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      {new Date(asset.last_service_date).toLocaleDateString('pl-PL')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Asset form modal */}
      {modalAsset !== undefined && (
        <AssetFormModal
          asset={modalAsset}
          onClose={closeModal}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
