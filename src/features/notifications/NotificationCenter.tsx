import { Bell, CheckCheck, RefreshCw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Dialog, IconButton } from '@/components/ui'
import { useActiveWorkspace } from '@/features/workspace'
import type { SmartNotification } from './api'
import {
  useDismissNotification,
  useNotificationSummary,
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
  useRefreshNotifications,
} from './hooks'
import styles from './notifications.module.css'

const when = (value: string) => {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diff / 60_000))
  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours} h`
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(date)
}

const severityText = {
  INFO: 'Información',
  WARNING: 'Atención',
  CRITICAL: 'Importante',
  SUCCESS: 'Progreso',
} as const

export function NotificationRow({
  item,
  compact = false,
}: {
  item: SmartNotification
  compact?: boolean
}) {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const navigate = useNavigate()
  const read = useReadNotification(workspaceId)
  const dismiss = useDismissNotification(workspaceId)

  const openAction = () => {
    if (!item.readAt) read.mutate(item.id)
    if (item.actionUrl) navigate(item.actionUrl)
  }

  return (
    <article
      className={styles.notification}
      data-read={Boolean(item.readAt)}
      data-severity={item.severity}
    >
      <span className={styles.severityDot} aria-hidden="true" />
      <div className={styles.notificationBody}>
        <div className={styles.notificationTopline}>
          <strong>{item.title}</strong>
          <small>{when(item.createdAt)}</small>
        </div>
        <p>{item.message}</p>
        <div className={styles.notificationMeta}>
          <span>{severityText[item.severity]}</span>
          {!item.readAt ? <span>Sin leer</span> : null}
        </div>
        {!compact && item.context && Object.keys(item.context).length > 0 ? (
          <details className={styles.contextDetails}>
            <summary>Ver contexto</summary>
            <dl>
              {Object.entries(item.context).slice(0, 6).map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </details>
        ) : null}
      </div>
      <div className={styles.notificationActions}>
        {item.actionUrl ? (
          <Button variant="secondary" onClick={openAction}>
            {item.actionLabel ?? 'Abrir'}
          </Button>
        ) : !item.readAt ? (
          <Button variant="secondary" onClick={() => read.mutate(item.id)}>
            Marcar leída
          </Button>
        ) : null}
        <IconButton
          aria-label={`Descartar alerta: ${item.title}`}
          onClick={() => dismiss.mutate(item.id)}
          disabled={dismiss.isPending}
        >
          <X size={16} />
        </IconButton>
      </div>
    </article>
  )
}

export function NotificationCenter() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id ?? ''
  const [open, setOpen] = useState(false)
  const summary = useNotificationSummary(workspaceId)
  const notifications = useNotifications(workspaceId, 'ALL', 1, 8)
  const refresh = useRefreshNotifications(workspaceId)
  const readAll = useReadAllNotifications(workspaceId)
  const navigate = useNavigate()
  const unread = summary.data?.unread ?? 0
  const items = useMemo(() => notifications.data?.items ?? [], [notifications.data])

  if (!activeWorkspace) return null

  return (
    <>
      <div className={styles.bellWrap}>
        <IconButton
          aria-label={unread ? `Alertas: ${unread} sin leer` : 'Alertas'}
          onClick={() => setOpen(true)}
        >
          <Bell size={20} />
        </IconButton>
        {unread > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </div>

      <Dialog open={open} title="Alertas" size="wide" onClose={() => setOpen(false)}>
        <div className={styles.center}>
          <div className={styles.centerHeader}>
            <div>
              <strong>{unread ? `${unread} alerta${unread === 1 ? '' : 's'} sin leer` : 'Estás al día'}</strong>
              <span>Fynar prioriza solo eventos financieros que requieren atención.</span>
            </div>
            <div className={styles.centerHeaderActions}>
              <Button
                variant="secondary"
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending}
              >
                <RefreshCw size={15} /> {refresh.isPending ? 'Revisando…' : 'Actualizar'}
              </Button>
              {unread > 0 ? (
                <Button
                  variant="secondary"
                  onClick={() => readAll.mutate()}
                  disabled={readAll.isPending}
                >
                  <CheckCheck size={15} /> Marcar todas
                </Button>
              ) : null}
            </div>
          </div>

          {notifications.isPending ? (
            <div className={styles.state}>Cargando alertas…</div>
          ) : notifications.isError ? (
            <div className={styles.state}>
              No pudimos cargar las alertas.
              <Button variant="secondary" onClick={() => void notifications.refetch()}>
                Reintentar
              </Button>
            </div>
          ) : items.length ? (
            <div className={styles.list}>
              {items.map((item) => (
                <NotificationRow key={item.id} item={item} compact />
              ))}
            </div>
          ) : (
            <div className={styles.state}>No hay alertas activas en este momento.</div>
          )}

          <div className={styles.footer}>
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false)
                navigate('/app/notifications')
              }}
            >
              Ver centro completo
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
