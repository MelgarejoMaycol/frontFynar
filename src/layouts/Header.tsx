import { Menu } from 'lucide-react'
import type { RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar, Button, Dropdown, IconButton } from '@/components/ui'
import { useLogout, useSession } from '@/features/auth'
import { NotificationCenter } from '@/features/notifications'
import { getRouteNavigation } from './navigation'
import styles from './layouts.module.css'
export function Header({
  menuOpen,
  onMenu,
  menuButtonRef,
}: {
  menuOpen: boolean
  onMenu: () => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
}) {
  const pathname = useLocation().pathname
  const route = getRouteNavigation(pathname)
  const title = route?.label ?? 'Fynar'
  const RouteIcon = route?.icon
  const session = useSession()
  const logout = useLogout()
  const navigate = useNavigate()
  const user = session.data
  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ')
    : 'Cuenta'
  return (
    <header className={styles.header} aria-label="Encabezado de aplicación">
      <div className={styles.headerStart}>
        <IconButton
          ref={menuButtonRef}
          className={styles.menuButton}
          aria-label="Abrir menú principal"
          aria-controls="app-sidebar"
          aria-expanded={menuOpen}
          onClick={onMenu}
        >
          <Menu size={22} />
        </IconButton>
        <div className={styles.titleGroup}>
          <p className={styles.headerTitle}>
            {title}
            {RouteIcon && <RouteIcon size={18} aria-hidden="true" />}
          </p>
        </div>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
      >
        <NotificationCenter />
        <Dropdown
          label="Menú de cuenta"
          trigger={
            <span className={styles.accountTrigger}>
              <Avatar name={displayName} src={user?.avatarUrl ?? undefined} />
              <span className={styles.accountName}>{displayName}</span>
            </span>
          }
        >
          <Link className={styles.accountMenuLink} to="/app/settings">
            Configuración
          </Link>
          <Button
            className={styles.accountMenuButton}
            variant="ghost"
            loading={logout.isPending}
            onClick={() => {
              logout.mutate(undefined, {
                onSettled: () => navigate('/login', { replace: true }),
              })
            }}
          >
            Cerrar sesión
          </Button>
        </Dropdown>
      </div>
    </header>
  )
}
