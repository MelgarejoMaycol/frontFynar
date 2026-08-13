import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Landmark, Plus } from 'lucide-react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Button, FilterPanel, PageHeader } from '@/components/ui'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { AccountsSummary } from '../components/AccountsSummary'
import { DashboardPeriodFilter } from '../components/DashboardPeriodFilter'
import { FinancialSummary } from '../components/FinancialSummary'
import { RecentTransactions } from '../components/RecentTransactions'
import { DashboardSkeleton } from '../components/DashboardSkeleton'
import { getDashboardErrorMessage } from '../dashboard.errors'
import { useDashboard } from '../hooks/dashboard.hooks'
import { LiabilitiesDashboardWidget } from '@/features/liabilities/LiabilitiesDashboardWidget'
import type { DashboardParams } from '../types/dashboard.types'
import styles from '../components/dashboard.module.css'
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
  const [params, setParams] = useState<DashboardParams>({
    period: 'CURRENT_MONTH',
    recentLimit: 5,
  })
  const validationError = customError(params)
  const dashboard = useDashboard(
    workspace.id,
    params,
    canRead && !validationError,
  )
  const categories = useCategories(workspace.id, canReadCategories)
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar el dashboard de este workspace."
      />
    )
  return (
    <div className={styles.page}>
      <PageHeader
        title="Inicio"
        description="Así están tus finanzas actualmente."
      />
      <FilterPanel title="Periodo" active={params.period !== 'CURRENT_MONTH'}>
        <DashboardPeriodFilter
          value={params}
          onChange={setParams}
          error={validationError}
        />
      </FilterPanel>
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
              <Button onClick={() => navigate('/app/accounts?new=1')}>
                Crear mi primera cuenta
              </Button>
            }
          />
        ) : (
          <>
            <div className={styles.quickActions} aria-label="Acciones rápidas">
              <Button
                variant="secondary"
                onClick={() => navigate('/app/accounts?new=1')}
              >
                <Landmark size={18} aria-hidden="true" /> Crear cuenta
              </Button>
              <Button onClick={() => navigate('/app/transactions?new=1')}>
                <Plus size={18} aria-hidden="true" /> Nuevo movimiento
              </Button>
              {canReadDebts && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/app/debts')}
                >
                  Ver créditos y pagos
                </Button>
              )}
            </div>
            <div className={styles.currencySections}>
              {dashboard.data.summariesByCurrency.map((summary) => (
                <FinancialSummary key={summary.currency} summary={summary} />
              ))}
            </div>
            <LiabilitiesDashboardWidget />
            <AccountsSummary accounts={dashboard.data.accountBalances} />
            {dashboard.data.recentTransactions.length === 0 ? (
              <EmptyState
                title="Registra tu primer movimiento"
                message="Añade un ingreso, gasto o transferencia para empezar tu historial."
                action={
                  <Button onClick={() => navigate('/app/transactions?new=1')}>
                    Nuevo movimiento
                  </Button>
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
    </div>
  )
}
