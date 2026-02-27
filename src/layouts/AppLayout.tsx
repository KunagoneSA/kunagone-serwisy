import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Truck, History, Settings, Menu, X, LogOut, User } from 'lucide-react'
import { useOverdueCount } from '../hooks/useOverdueCount'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Panel główny', showBadge: true },
  { to: '/zasoby', icon: Truck, label: 'Zasoby', showBadge: false },
  { to: '/historia', icon: History, label: 'Historia zmian', showBadge: false },
  { to: '/ustawienia', icon: Settings, label: 'Ustawienia', showBadge: false },
] as const

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function emailLabel(email?: string) {
  if (!email) return ''
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count: overdueCount } = useOverdueCount()
  const { user, signOut } = useAuth()

  const renderNavLink = (
    { to, icon: Icon, label, showBadge }: typeof navItems[number],
    onClick?: () => void
  ) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-red-900/60 text-white'
            : 'text-red-100/70 hover:bg-red-900/40 hover:text-white'
        }`
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
      {showBadge && <NavBadge count={overdueCount} />}
    </NavLink>
  )

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-red-900 bg-red-800">
        <div className="flex h-14 items-center gap-2 px-5 border-b border-red-700">
          <img src="/icons/logo-kunagone.svg" alt="Kunagone" className="h-7 w-7" />
          <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
            Kunagone Serwisy
          </span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => renderNavLink(item))}
        </nav>
        <div className="border-t border-red-700 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-900/60">
              <User className="h-3.5 w-3.5 text-red-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-100 truncate">{emailLabel(user?.email)}</p>
              <p className="text-[10px] text-red-300/50">Kunagone S.A.</p>
            </div>
            <button
              onClick={signOut}
              title="Wyloguj"
              className="rounded-md p-1 text-red-300/50 hover:text-red-100 hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-red-800 transform transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-red-700">
          <div className="flex items-center gap-2">
            <img src="/icons/logo-kunagone.svg" alt="Kunagone" className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-wide text-slate-100 uppercase">
              Serwisy
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-red-200 hover:text-white hover:bg-red-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
        </nav>
        <div className="border-t border-red-700 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-900/60">
              <User className="h-3.5 w-3.5 text-red-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-100 truncate">{emailLabel(user?.email)}</p>
              <p className="text-[10px] text-red-300/50">Kunagone S.A.</p>
            </div>
            <button
              onClick={signOut}
              title="Wyloguj"
              className="rounded-md p-1 text-red-300/50 hover:text-red-100 hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="relative rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
            {overdueCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {overdueCount > 99 ? '!' : overdueCount}
              </span>
            )}
          </button>
          <span className="text-sm font-semibold tracking-wide text-slate-800 uppercase">
            Kunagone Serwisy
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
