import { Navigate } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { usePreferences } from '../hooks/workspace.hooks'
import { resolveStartScreen } from '../start-screen'

export function InitialPrivateRedirect() {
  const preferences = usePreferences()
  if (preferences.isPending) return <PageLoader />
  if (preferences.isError)
    return (
      <ErrorState
        title="No pudimos cargar tus preferencias"
        message="Comprueba tu conexión e inténtalo nuevamente."
        onRetry={() => void preferences.refetch()}
      />
    )
  return (
    <Navigate to={resolveStartScreen(preferences.data?.startScreen)} replace />
  )
}
