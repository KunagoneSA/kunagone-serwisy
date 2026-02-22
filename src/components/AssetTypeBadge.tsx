import type { AssetType } from '../types/database'

const config: Record<AssetType, { label: string; className: string }> = {
  vehicle: {
    label: 'Pojazd',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  equipment: {
    label: 'Sprzęt',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  infrastructure: {
    label: 'Infrastruktura',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
  },
}

export default function AssetTypeBadge({ type }: { type: AssetType }) {
  const { label, className } = config[type]
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}
