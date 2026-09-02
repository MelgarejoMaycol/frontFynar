import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/config/env'
import App from '@/App'
import { AppProviders } from '@/app/providers/AppProviders'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PwaPrompt } from '@/components/pwa/PwaPrompt'
import '@/styles/globals.css'
import '@/styles/mobile-fixes.css'
import { applyCachedTheme } from '@/features/workspace/theme'
import { initializeObservability } from '@/services/observability/sentry'

applyCachedTheme()
initializeObservability()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
  })
}

const root = document.getElementById('root')

if (!root) throw new Error('No se encontró el elemento raíz de la aplicación')

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <App />
        <PwaPrompt />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
)
