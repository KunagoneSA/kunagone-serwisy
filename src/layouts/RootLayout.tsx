import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
