import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AssetsPage = lazy(() => import('./pages/AssetsPage'))
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const MileageReportPage = lazy(() => import('./pages/MileageReportPage'))

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" /></div>}>
      {children}
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <LazyPage><DashboardPage /></LazyPage> },
          { path: 'zasoby', element: <LazyPage><AssetsPage /></LazyPage> },
          { path: 'zasoby/:id', element: <LazyPage><AssetDetailPage /></LazyPage> },
          { path: 'przebieg', element: <LazyPage><MileageReportPage /></LazyPage> },
          { path: 'historia', element: <LazyPage><AuditLogPage /></LazyPage> },
          { path: 'ustawienia', element: <LazyPage><SettingsPage /></LazyPage> },
        ],
      },
    ],
  },
])
