import type { AuthUser } from '@/features/auth/types/auth.types'
import type {
  UserPreferences,
  Workspace,
} from '@/features/workspace/types/workspace.types'

const DEMO_SESSION_KEY = 'fynar-demo-session'

export const demoCredentials = Object.freeze({
  email: 'demo@fynar.app',
  password: 'fynar-demo-local',
})

export const demoUser: AuthUser = {
  id: 'demo-user',
  email: demoCredentials.email,
  firstName: 'Usuario',
  lastName: 'Demo',
  phone: null,
  avatarUrl: null,
  isEmailVerified: true,
  isActive: true,
  createdAt: '2025-09-01T12:00:00.000Z',
  updatedAt: '2026-09-14T12:00:00.000Z',
}

export const demoWorkspace: Workspace = {
  id: 'demo-workspace',
  name: 'Finanzas Demo',
  type: 'PERSONAL',
  baseCurrency: 'COP',
  timezone: 'America/Bogota',
  isActive: true,
  role: 'OWNER',
  membershipStatus: 'ACTIVE',
  permissions: [],
  isDefault: true,
}

export const demoPreferences: UserPreferences = {
  defaultWorkspaceId: demoWorkspace.id,
  language: 'es-CO',
  currency: 'COP',
  timezone: 'America/Bogota',
  dateFormat: 'DD/MM/YYYY',
  theme: 'SYSTEM',
  startScreen: 'DASHBOARD',
  financialCycleStartDay: 5,
  dashboardLayout: {
    projection: {
      mode: 'MONTH_END',
      enabled: true,
      expectedMonthlyIncome: '4100000',
      payDay: 5,
    },
  },
  createdAt: '2025-09-01T12:00:00.000Z',
  updatedAt: '2026-09-14T12:00:00.000Z',
}

export const isDemoSession = () =>
  typeof window !== 'undefined' &&
  window.sessionStorage.getItem(DEMO_SESSION_KEY) === '1'

export const markDemoSession = () => {
  if (typeof window !== 'undefined')
    window.sessionStorage.setItem(DEMO_SESSION_KEY, '1')
}

export const clearDemoSession = () => {
  if (typeof window !== 'undefined')
    window.sessionStorage.removeItem(DEMO_SESSION_KEY)
}
