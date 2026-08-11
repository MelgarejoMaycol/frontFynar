import { Outlet } from 'react-router'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace } from '../hooks/workspace.hooks'

export function WorkspaceGate() {
  const workspaces = useActiveWorkspace()
  if (workspaces.isPending) return <PageLoader />
  if (workspaces.isError) {
    return (
      <ErrorState
        title="No pudimos cargar tus espacios"
        message="Comprueba tu conexión e inténtalo nuevamente."
        onRetry={() => void workspaces.refetch()}
      />
    )
  }
  if (!workspaces.activeWorkspace) {
    return (
      <EmptyState
        title="No encontramos un espacio financiero"
        message="No hay un workspace activo asociado a tu cuenta. Intenta recargar o vuelve a iniciar sesión."
      />
    )
  }
  return <Outlet />
}
