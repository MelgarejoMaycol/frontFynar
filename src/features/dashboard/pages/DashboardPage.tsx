import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Landmark, Plus, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button, Dialog, FilterPanel, PageHeader } from '@/components/ui'
import { AccountForm } from '@/features/accounts/components/AccountForm'
import { useCreateAccount } from '@/features/accounts/hooks/accounts.hooks'
import type { AccountInput } from '@/features/accounts/types/account.types'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { FinancialHealthWidget } from '@/features/financial-health'
import { MonthEndProjectionCard } from '@/features/forecasts/components/MonthEndProjectionCard'
import { TransactionForm } from '@/features/transactions/components/TransactionForm'
import { useCreateTransaction } from '@/features/transactions/hooks/transactions.hooks'
import type { CreateTransactionInput } from '@/features/transactions/types/transaction.types'
import {
  useActiveWorkspace,
  usePermission,
  usePreferences,
} from '@/features/workspace'
import { AccountsSummary } from '../components/AccountsSummary'
import { ActionableOverview } from '../components/ActionableOverview'
import { DashboardPeriodFilter } from '../components/DashboardPeriodFilter'
import { FinancialSummary } from '../components/FinancialSummary'
import { RecentTransactions } from '../components/RecentTransactions'
import { DashboardSkeleton } from '../components/DashboardSkeleton'
import { getDashboardErrorMessage } from '../dashboard.errors'
import { useDashboard } from '../hooks/dashboard.hooks'
import { LiabilitiesDashboardWidget } from '@/features/liabilities/LiabilitiesDashboardWidget'
import type { DashboardParams } from '../types/dashboard.types'
import styles from '../components/dashboard.module.css'
import planningStyles from '../components/DashboardPlanning.module.css'
import { BudgetDashboardWidget } from '../components/BudgetDashboardWidget'
import { GoalsDashboardWidget } from '../components/GoalsDashboardWidget'

const customError = (params: DashboardParams) => {
  if (params.period !== 'CUSTOM') return undefined
  if (!params.dateFrom || !params.dateTo)
    return 'Selecciona las fechas desde y hasta.'
  if (params.dateFrom > params.dateTo)
    return 'La fecha desde no puede ser posterior a la fecha hasta.'
  return undefined
}

export function DashboardPage() {
  const navigate = useNavigate()
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('reports.read')
  const canReadCategories = usePermission('categories.read')
  const canReadDebts = usePermission('debts.read')
  const canCreateTransactions = usePermission('transactions.write')
  const canCreateAccounts = usePermission('accounts.write')
  const preferences = usePreferences()
  const [selectedParams, setSelectedParams] = useState<DashboardParams | null>(
    null,
  )
  const [creatingTransaction, setCreatingTransaction] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [transactionCreationKey, setTransactionCreationKey] = useState(0)
  const [accountCreationKey, setAccountCreationKey] = useState(0)
  const [quickMessage, setQuickMessage] = useState('')

  const params = selectedParams ?? {
    period: preferences.data?.financialCycleStartDay
      ? ('MY_CYCLE' as const)
      : ('CURRENT_MONTH' as const),
    recentLimit: 5,
  }
  const validationError = customError(params)
  const dashboard = useDashboard(
    workspace.id,
    params,
    canRead && preferences.isSuccess && !validationError,
  )
  const categories = useCategories(workspace.id, canReadCategories)
  const createTransaction = useCreateTransaction(workspace.id)
  const createAccount = useCreateAccount(workspace.id)

  const closeTransaction = () => {
    setCreatingTransaction(false)
    createTransaction.reset()
  }
  const closeAccount = () => {
    setCreatingAccount(false)
    createAccount.reset()
  }
  const openTransaction = () => {
    setQuickMessage('')
    setCreatingTransaction(true)
  }
  const openAccount = () => {
    setQuickMessage('')
    setCreatingAccount(true)
  }

  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar el dashboard de este workspace."
      />
    )

  return (
    <div className={styles.page}>
      <section className={styles.topPanel} aria-label="Resumen de inicio">
        <div className={styles.topPanelGlow} aria-hidden="true" />
        <div className={styles.topPanelContent}>
          <div className={styles.dashboardEyebrow}>
            <Sparkles size={15} aria-hidden="true" />
            Tu panorama financiero
          </div>
          <PageHeader
            title="Inicio"
            description="Así están tus finanzas actualmente."
          />
          <FilterPanel title="Periodo" active={params.period === 'MY_CYCLE'}>
            <DashboardPeriodFilter
              value={params}
              onChange={setSelectedParams}
              error={validationError}
              financialCycleConfigured={Boolean(
                preferences.data?.financialCycleStartDay,
              )}
              onConfigureCycle={() => navigate('/app/settings#preferences')}
            />
          </FilterPanel>
          <div className={styles.quickActions} aria-label="Acciones rápidas">
            {canCreateTransactions && (
              <Button onClick={openTransaction}>
                <Plus size={18} aria-hidden="true" /> Nuevo movimiento
              </Button>
            )}
            {canCreateAccounts && (
              <Button variant="secondary" onClick={openAccount}>
                <Landmark size={18} aria-hidden="true" /> Crear cuenta
              </Button>
            )}
            {canReadDebts && (
              <Button
                variant="secondary"
                onClick={() => navigate('/app/commitments')}
              >
                Ver créditos y deudas
              </Button>
            )}
          </div>
        </div>
      </section>

      {quickMessage && (
        <p className={styles.quickSuccess} role="status">
          {quickMessage}
        </p>
      )}

      {dashboard.isPending && !validationError ? (
        <DashboardSkeleton />
      ) : dashboard.isError ? (
        <ErrorState
          title="No pudimos cargar el dashboard"
          message={getDashboardErrorMessage(dashboard.error)}
          onRetry={() => void dashboard.refetch()}
        />
      ) : dashboard.data ? (
        dashboard.data.accountBalances.length === 0 &&
        dashboard.data.recentTransactions.length === 0 ? (
          <EmptyState
            title="Empieza a organizar tus finanzas"
            message="Crea tu primera cuenta para comenzar a registrar ingresos y gastos."
            action={
              canCreateAccounts ? (
                <Button onClick={openAccount}>Crear mi primera cuenta</Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ActionableOverview
              summaries={dashboard.data.summariesByCurrency}
              accounts={dashboard.data.accountBalances}
              comparisons={dashboard.data.comparisonByCurrency}
              workspaceId={workspace.id}
              timezone={workspace.timezone}
            />

            <MonthEndProjectionCard workspaceId={workspace.id} />

            <FinancialHealthWidget workspaceId={workspace.id} />

            <div className={styles.currencySections}>
              {dashboard.data.summariesByCurrency.map((summary) => (
                <FinancialSummary
                  key={summary.currency}
                  summary={summary}
                  comparison={dashboard.data.comparisonByCurrency.find(
                    (item) => item.currency === summary.currency,
                  )}
                />
              ))}
            </div>

            <LiabilitiesDashboardWidget />

            <div className={planningStyles.grid}>
              <BudgetDashboardWidget />
              <GoalsDashboardWidget />
            </div>

            <AccountsSummary accounts={dashboard.data.accountBalances} />
            {dashboard.data.recentTransactions.length === 0 ? (
              <EmptyState
                title="Registra tu primer movimiento"
                message="Añade un ingreso, gasto o transferencia para empezar tu historial."
                action={
                  canCreateTransactions ? (
                    <Button onClick={openTransaction}>Nuevo movimiento</Button>
                  ) : undefined
                }
              />
            ) : (
              <RecentTransactions
                items={dashboard.data.recentTransactions}
                timezone={workspace.timezone}
                accounts={dashboard.data.accountBalances}
                categories={categories.data ?? []}
              />
            )}
          </>
        )
      ) : null}

      <Dialog
        open={creatingTransaction}
        title="Registrar movimiento"
        size="wide"
        onClose={() => !createTransaction.isPending && closeTransaction()}
      >
        <TransactionForm
          key={`dashboard-transaction-${transactionCreationKey}`}
          workspaceId={workspace.id}
          timezone={workspace.timezone}
          pending={createTransaction.isPending}
          error={createTransaction.error}
          onCancel={closeTransaction}
          onSubmit={(input) =>
            createTransaction.mutate(input as CreateTransactionInput, {
              onSuccess: () => {
                setTransactionCreationKey((value) => value + 1)
                setQuickMessage('Movimiento registrado correctamente.')
                closeTransaction()
              },
            })
          }
        />
      </Dialog>

      <Dialog
        open={creatingAccount}
        title="Nueva cuenta"
        onClose={() => !createAccount.isPending && closeAccount()}
      >
        <AccountForm
          key={`dashboard-account-${accountCreationKey}`}
          currency={workspace.baseCurrency}
          pending={createAccount.isPending}
          error={createAccount.error}
          onCancel={closeAccount}
          onSubmit={(input) =>
            createAccount.mutate(input as AccountInput, {
              onSuccess: () => {
                setAccountCreationKey((value) => value + 1)
                setQuickMessage('Cuenta creada correctamente.')
                closeAccount()
              },
            })
          }
        />
      </Dialog>
    </div>
  )
}
