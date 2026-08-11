import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import styles from './feedback.module.css'
import { ToastContext, type ToastTone } from './toast-context'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback(
    (id: number) =>
      setToasts((items) => items.filter((item) => item.id !== id)),
    [],
  )
  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((items) => [...items, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 4000)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ showToast }), [showToast])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={styles.toastViewport}
        aria-live="polite"
        aria-label="Notificaciones"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.tone === 'success'
              ? CheckCircle2
              : toast.tone === 'error'
                ? CircleAlert
                : Info
          return (
            <div
              key={toast.id}
              className={`${styles.toast} ${styles[`toast${toast.tone}`]}`}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(toast.id)}
              >
                <X size={17} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
