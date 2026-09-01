import { useEffect, useState } from 'react'
import { Download, RefreshCw, Share, X } from 'lucide-react'
import styles from './pwa.module.css'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const INSTALL_DISMISSED_KEY = 'fynar:pwa-install-dismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent)

const shouldShowIosInstallHelp = () => {
  if (typeof window === 'undefined') return false
  const dismissed = window.localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true'
  return isIos() && !isStandalone() && !dismissed
}

export function PwaPrompt() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [showIosHelp, setShowIosHelp] = useState(shouldShowIosInstallHelp)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }

    const onControllerChange = () => {
      if (!updating) return
      window.location.reload()
    }

    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(registration.waiting)
      }

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(worker)
          }
        })
      })
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    navigator.serviceWorker.ready.then(inspectRegistration).catch(() => undefined)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [updating])

  const dismissInstall = () => {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, 'true')
    setInstallPrompt(null)
    setShowIosHelp(false)
  }

  const install = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  const update = () => {
    if (!waitingWorker) return
    setUpdating(true)
    waitingWorker.postMessage({ type: 'SKIP_WAITING' })
  }

  if (waitingWorker) {
    return (
      <aside className={styles.prompt} role="status" aria-live="polite">
        <span className={styles.icon}>
          <RefreshCw size={19} aria-hidden="true" />
        </span>
        <div className={styles.copy}>
          <strong>Nueva versión de Fynar disponible</strong>
          <span>Actualiza para usar las mejoras más recientes.</span>
        </div>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={update}
          disabled={updating}
        >
          {updating ? 'Actualizando…' : 'Actualizar ahora'}
        </button>
      </aside>
    )
  }

  if (installPrompt && !isStandalone()) {
    return (
      <aside className={styles.prompt} role="status">
        <span className={styles.icon}>
          <Download size={19} aria-hidden="true" />
        </span>
        <div className={styles.copy}>
          <strong>Instala Fynar en tu teléfono</strong>
          <span>Ábrelo como una app y entra más rápido.</span>
        </div>
        <button type="button" className={styles.primaryAction} onClick={() => void install()}>
          Instalar
        </button>
        <button
          type="button"
          className={styles.close}
          onClick={dismissInstall}
          aria-label="Ocultar instalación"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </aside>
    )
  }

  if (showIosHelp) {
    return (
      <aside className={styles.prompt} role="status">
        <span className={styles.icon}>
          <Share size={19} aria-hidden="true" />
        </span>
        <div className={styles.copy}>
          <strong>Instala Fynar en tu iPhone</strong>
          <span>En Safari toca Compartir y luego “Añadir a pantalla de inicio”.</span>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={dismissInstall}
          aria-label="Ocultar instrucciones"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </aside>
    )
  }

  return null
}
