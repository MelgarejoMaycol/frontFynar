import { Navigate, Outlet, useLocation } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useAuthStore } from '../store/auth.store'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()
  if (status === 'checking') return <PageLoader />
  if (status !== 'authenticated')
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  return <Outlet />
}

export function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  if (status === 'checking') return <PageLoader />
  if (status === 'authenticated') return <Navigate to="/app" replace />
  return <Outlet />
}
