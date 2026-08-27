import * as Sentry from '@sentry/react'
import { env } from '@/config/env'

export function initializeObservability() {
  if (!env.sentryDsn) return
  Sentry.init({
    dsn: env.sentryDsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    beforeSend(event) {
      delete event.request
      delete event.user
      delete event.extra
      delete event.contexts
      delete event.breadcrumbs
      return event
    },
  })
}

export function captureClientException(error: unknown) {
  if (env.sentryDsn) Sentry.captureException(error)
}
