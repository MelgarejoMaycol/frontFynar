import type { UserPreferences } from './types/workspace.types'

export function resolveStartScreen(
  preference: UserPreferences['startScreen'] | string | null | undefined,
) {
  if (preference === 'TRANSACTIONS') return '/app/transactions'
  if (preference === 'BUDGETS') return '/app/budgets'
  return '/app/dashboard'
}
