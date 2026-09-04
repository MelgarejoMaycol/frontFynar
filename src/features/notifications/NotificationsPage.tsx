import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button, PageHeader } from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace } from '@/features/workspace'
import { NotificationRow } from './NotificationCenter'
import {
  useNotifications,
  useReadAllNotifications,
  useRefreshNotifications,
} from './hooks'
import styles from './notifications.module.css'

type Filter = 'ALL' | 'UNREAD' | 'READ'

export function NotificationsPage() {
  const { activeWorkspace } = useActiveWorkspace()
  const workspaceId = activeWorkspace!.id
  const [filter, setFilter] = useState<Filter>('ALL')
  const [page, setPage] = useState(1)
  const notifications = useNotifications(workspaceId, filter, page, 30)
  const refresh = useRefreshNotifications(workspaceId)
  const readAll = useReadAllNotifications(workspaceId)

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Centro de alertas"
        description="Eventos financieros que requieren atención, con contexto y acceso directo al módulo relacionado."
        actions={
          <div className={styles.pageActions}>
            <Button
              variant="secondary"
              onClick={() => refresh.mutate()}
              disabled={refresh.isPending}
            >
              <RefreshCw size={16} /> {refresh.isPending ? 'Analizando…' : 'Actualizar alertas'}
            </Button>
            {(notifications.data?.unread ?? 0) > 0 ? (
              <Button
                variant="secondary"
                onClick={() => readAll.mutate()}
                disabled={readAll.isPending}
              >
                <CheckCheck size={16} /> Marcar todas como leídas
              </Button>
            ) : null}
          </div>
        }
      />

      <section className={styles.overview}>
        <div>
          <Bell size={20} aria-hidden="true" />
          <span>Sin leer</span>
          <strong>{notifications.data?.unread ?? 0}</strong>
        </div>
        <div>
          <span>Total activas</span>
          <strong>{notifications.data?.total ?? 0}</strong>
        </div>
        <p>
          Las alertas se deduplican: una misma condición no debería aparecer repetidamente mientras siga representando el mismo evento.
        </p>
      </section>

      <div className={styles.filters} role="tablist" aria-label="Filtrar alertas">
        {([
          ['ALL', 'Todas'],
          ['UNREAD', 'Sin leer'],
          ['READ', 'Leídas'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={filter === value ? styles.activeFilter : ''}
            onClick={() => changeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {notifications.isPending ? (
        <PageLoader />
      ) : notifications.isError ? (
        <ErrorState
          title="No pudimos cargar el centro de alertas"
          message={notifications.error instanceof Error ? notifications.error.message : 'Inténtalo nuevamente.'}
          onRetry={() => void notifications.refetch()}
        />
      ) : notifications.data!.items.length ? (
        <>
          <div className={styles.fullList}>
            {notifications.data!.items.map((item) => (
              <NotificationRow key={item.id} item={item} />
            ))}
          </div>
          {notifications.data!.totalPages > 1 ? (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <span>Página {page} de {notifications.data!.totalPages}</span>
              <Button
                variant="secondary"
                disabled={page >= notifications.data!.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <div className={styles.empty}>
          <Bell size={24} aria-hidden="true" />
          <strong>No hay alertas para este filtro.</strong>
          <span>Fynar mostrará aquí únicamente condiciones relevantes detectadas con datos reales.</span>
        </div>
      )}
    </div>
  )
}
