import { Navigate } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { usePreferences } from '../hooks/workspace.hooks'
import { resolveStartScreen } from '../start-screen'

export function InitialPrivateRedirect() {
  const preferences = usePreferences()
  if (preferences.isPending) return <PageLoader />
  if (preferences.isError && !preferences.data)
    return (
      <ErrorState
        title="No pudimos cargar tus preferencias"
        message="La información todavía no respondió. El servidor puede estar iniciando o la red puede estar lenta. Inténtalo nuevamente en unos segundos."
        onRetry={() => void preferences.refetch()}
      />
    )
  return (
    <Navigate to={resolveStartScreen(preferences.data?.startScreen)} replace />
  )
}
