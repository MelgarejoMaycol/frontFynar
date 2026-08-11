import { Navigate } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { usePreferences } from '../hooks/workspace.hooks'
import { resolveStartScreen } from '../start-screen'

export function InitialPrivateRedirect() {
  const preferences = usePreferences()
  if (preferences.isPending) return <PageLoader />
  return (
    <Navigate to={resolveStartScreen(preferences.data?.startScreen)} replace />
  )
}
