import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/config/env'
import App from '@/App'
import { AppProviders } from '@/app/providers/AppProviders'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import '@/styles/globals.css'
import { applyCachedTheme } from '@/features/workspace/theme'
import { initializeObservability } from '@/services/observability/sentry'

applyCachedTheme()
initializeObservability()

const root = document.getElementById('root')

if (!root) throw new Error('No se encontró el elemento raíz de la aplicación')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
