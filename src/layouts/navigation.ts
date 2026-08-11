import {
  ChartNoAxesCombined,
  CircleDollarSign,
  FolderTree,
  Gauge,
  Landmark,
  Settings,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
export type NavigationItem = { to: string; label: string; icon: LucideIcon }
export const mainNavigation: NavigationItem[] = [
  { to: '/app/dashboard', label: 'Inicio', icon: Gauge },
  { to: '/app/accounts', label: 'Cuentas', icon: Landmark },
  { to: '/app/categories', label: 'Categorías', icon: FolderTree },
  { to: '/app/transactions', label: 'Movimientos', icon: CircleDollarSign },
  { to: '/app/budgets', label: 'Presupuestos', icon: WalletCards },
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
  const normalizedPath = normalizePath(pathname)
  const exactMatch = appNavigation.find((item) => item.to === normalizedPath)
  if (exactMatch) return exactMatch.label

  const parentMatch = [...appNavigation]
    .sort((first, second) => second.to.length - first.to.length)
    .find((item) => normalizedPath.startsWith(`${item.to}/`))

  return parentMatch?.label ?? 'Veloryx'
}
