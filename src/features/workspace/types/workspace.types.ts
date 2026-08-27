export type WorkspaceType = 'PERSONAL' | 'FAMILY' | 'BUSINESS'

export interface Workspace {
  id: string
  name: string
  type: WorkspaceType
  baseCurrency: string
  timezone: string
  isActive: boolean
  role: string
  membershipStatus: 'ACTIVE'
  permissions: string[]
  isDefault: boolean
}

export interface WorkspaceSelection {
  workspace: Workspace
  defaultWorkspaceId: string
  updatedAt: string
}

export interface UserPreferences {
  defaultWorkspaceId: string | null
  language: string
  currency: string
  timezone: string
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  theme: 'LIGHT' | 'DARK' | 'SYSTEM'
  startScreen: 'DASHBOARD' | 'TRANSACTIONS' | 'BUDGETS' | 'DEBTS'
  dashboardLayout: Record<string, unknown>
  financialCycleStartDay?: number | null
  createdAt: string
  updatedAt: string
}
export type UpdateUserPreferences = Partial<
  Pick<
    UserPreferences,
    | 'defaultWorkspaceId'
    | 'language'
    | 'currency'
    | 'timezone'
    | 'dateFormat'
    | 'theme'
    | 'startScreen'
    | 'dashboardLayout'
    | 'financialCycleStartDay'
  >
>
