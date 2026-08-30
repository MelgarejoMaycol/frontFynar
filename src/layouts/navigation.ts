import { APP_NAME } from '@/config/brand'
import {
  ChartNoAxesCombined,
  CircleDollarSign,
  FolderTree,
  Gauge,
  Landmark,
  Settings,
  WalletCards,
  HandCoins,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
export type NavigationItem = { to: string; label: string; icon: LucideIcon }
export const mainNavigation: NavigationItem[] = [
  { to: '/app/dashboard', label: 'Inicio', icon: Gauge },
  { to: '/app/accounts', label: 'Cuentas', icon: Landmark },
  { to: '/app/categories', label: 'Categorías', icon: FolderTree },
  { to: '/app/transactions', label: 'Movimientos', icon: CircleDollarSign },
  { to: '/app/budgets', label: 'Presupuestos', icon: WalletCards },
  { to: '/app/debts', label: 'Créditos y pagos', icon: HandCoins },
  { to: '/app/informal-balances', label: 'Debo y me deben', icon: UsersRound },
  { to: '/app/reports', label: 'Reportes', icon: ChartNoAxesCombined },
]
export const settingsNavigation = {
  to: '/app/settings',
  label: 'Configuración',
  icon: Settings,
}

export const appNavigation = [...mainNavigation, settingsNavigation]

const normalizePath = (pathname: string) => {
  const path = pathname.trim().split(/[?#]/, 1)[0] ?? ''
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  const normalized = withLeadingSlash.replace(/\/{2,}/g, '/').replace(/\/$/, '')
  return normalized || '/'
}

export function getRouteTitle(pathname: string): string {
  return getRouteNavigation(pathname)?.label ?? APP_NAME
}

export function getRouteNavigation(
  pathname: string,
): NavigationItem | undefined {
  const normalizedPath = normalizePath(pathname)
  const exactMatch = appNavigation.find((item) => item.to === normalizedPath)
  if (exactMatch) return exactMatch

  const parentMatch = [...appNavigation]
    .sort((first, second) => second.to.length - first.to.length)
    .find((item) => normalizedPath.startsWith(`${item.to}/`))

  return parentMatch
}
