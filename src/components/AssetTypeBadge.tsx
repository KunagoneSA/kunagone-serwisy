import { Car, Hammer, Building2, type LucideIcon } from 'lucide-react'
import type { AssetType } from '../types/database'

const config: Record<AssetType, { label: string; className: string; icon: LucideIcon }> = {
  vehicle: {
    label: 'Pojazd',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: Car,
  },
  equipment: {
    label: 'Sprzęt',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Hammer,
  },
  infrastructure: {
    label: 'Infrastruktura',
    className: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: Building2,
  },
}

export const typeIcons: Record<AssetType, LucideIcon> = {
  vehicle: Car,
  equipment: Hammer,
  infrastructure: Building2,
}

export default function AssetTypeBadge({ type }: { type: AssetType }) {
  const { label, className, icon: Icon } = config[type]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}
