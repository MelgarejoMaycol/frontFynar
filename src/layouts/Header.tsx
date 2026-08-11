import {
  ChartNoAxesCombined,
  CircleDollarSign,
  FolderTree,
  House,
  Landmark,
  Menu,
  Settings,
  WalletCards,
} from 'lucide-react'
import type { RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Avatar, Button, Dropdown, IconButton } from '@/components/ui'
import { useLogout, useSession } from '@/features/auth'
import { WorkspaceSelector } from '@/features/workspace'
import { getRouteTitle } from './navigation'
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
  const title = getRouteTitle(pathname)
  const isDashboard = pathname === '/app/dashboard'
  const isAccounts = pathname.startsWith('/app/accounts')
  const isCategories = pathname.startsWith('/app/categories')
  const isTransactions = pathname.startsWith('/app/transactions')
  const isBudgets = pathname.startsWith('/app/budgets')
  const isReports = pathname.startsWith('/app/reports')
  const isSettings = pathname.startsWith('/app/settings')
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
            {isDashboard && <House size={18} aria-hidden="true" />}
            {isAccounts && <Landmark size={18} aria-hidden="true" />}
            {isCategories && <FolderTree size={18} aria-hidden="true" />}
            {isTransactions && (
              <CircleDollarSign size={18} aria-hidden="true" />
            )}
            {isBudgets && <WalletCards size={18} aria-hidden="true" />}
            {isReports && <ChartNoAxesCombined size={18} aria-hidden="true" />}
            {isSettings && <Settings size={18} aria-hidden="true" />}
            {title}
          </p>
          {!isDashboard &&
            !isAccounts &&
            !isCategories &&
            !isTransactions &&
            !isBudgets &&
            !isReports &&
            !isSettings && <WorkspaceSelector />}
        </div>
      </div>
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
    </header>
  )
}
