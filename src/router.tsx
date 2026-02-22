import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import AssetsPage from './pages/AssetsPage'
import AuditLogPage from './pages/AuditLogPage'
import SettingsPage from './pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'zasoby', element: <AssetsPage /> },
      { path: 'historia', element: <AuditLogPage /> },
      { path: 'ustawienia', element: <SettingsPage /> },
    ],
  },
])
