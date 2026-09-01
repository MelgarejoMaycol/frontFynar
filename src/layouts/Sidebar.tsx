import { X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import clsx from 'clsx'
import { BrandLogo, IconButton } from '@/components/ui'
import {
  getRouteNavigation,
  mainNavigation,
  settingsNavigation,
  type NavigationItem,
} from './navigation'
import styles from './layouts.module.css'
function Item({
  item,
  onNavigate,
}: {
  item: NavigationItem
  onNavigate: () => void
}) {
  const Icon = item.icon
  const pathname = useLocation().pathname
  const currentNavigation = getRouteNavigation(pathname)
  const isCurrent = currentNavigation?.to === item.to

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(styles.navLink, (isCurrent || isActive) && styles.navLinkActive)
      }
    >
      <Icon size={19} aria-hidden="true" />
      <span>{item.label}</span>
    </NavLink>
  )
}
export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      <aside
        id="app-sidebar"
        className={clsx(styles.sidebar, open && styles.sidebarOpen)}
      >
        <div className={styles.sidebarHead}>
          <BrandLogo />
          <IconButton
            className={styles.sidebarClose}
            aria-label="Cerrar menú principal"
            onClick={onClose}
          >
            <X size={21} />
          </IconButton>
        </div>
        <nav className={styles.nav} aria-label="Navegación principal">
          {mainNavigation.map((item) => (
            <Item key={item.to} item={item} onNavigate={onClose} />
          ))}
          <div className={styles.navBottom}>
            <Item item={settingsNavigation} onNavigate={onClose} />
          </div>
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Cerrar menú principal"
          onClick={onClose}
        />
      )}
    </>
  )
}
