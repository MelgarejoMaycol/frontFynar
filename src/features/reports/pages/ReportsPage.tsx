import { useState, type ReactNode } from 'react'
import { Printer } from 'lucide-react'
import { Button, FilterPanel, PageHeader } from '@/components/ui'
import { APP_NAME } from '@/config/brand'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { AccountBalancesReport } from '../components/AccountBalancesReport'
import { CashFlowReport } from '../components/CashFlowReport'
import { ExpensesByCategoryReport } from '../components/ExpensesByCategoryReport'
import { IncomeVsExpensesReport } from '../components/IncomeVsExpensesReport'
import { ReportsPeriodFilter } from '../components/ReportsPeriodFilter'
import {
  useAccountBalancesReport,
  useCashFlow,
  useExpensesByCategory,
  useIncomeVsExpenses,
} from '../hooks/reports.hooks'
import { getReportErrorMessage } from '../reports.errors'
import { customRangeError, groupsForPeriod } from '../reports.validation'
import type { ReportGroup, ReportParams } from '../types/report.types'
import styles from '../components/reports.module.css'

function ReportSection({
  title,
  query,
  children,
}: {
  title: string
  query: {
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: () => unknown
  }
  children: ReactNode
}) {
  const id = `report-${title.replaceAll(' ', '-')}`
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHeader}>
        <h2 id={id}>{title}</h2>
        {query.isError && (
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        )}
      </div>
      {query.isPending ? (
        <PageLoader />
      ) : query.isError ? (
        <p role="alert">{getReportErrorMessage(query.error)}</p>
      ) : (
        children
      )}
    </section>
  )
}

export function ReportsPage() {
  const workspace = useActiveWorkspace().activeWorkspace!,
    canRead = usePermission('reports.read'),
    [params, setParams] = useState<ReportParams>({ period: 'CURRENT_MONTH' }),
    [groupBy, setGroupBy] = useState<ReportGroup>('DAY'),
    rangeError = customRangeError(params),
    validRange = rangeError === null,
    enabled = canRead && validRange,
    income = useIncomeVsExpenses(workspace.id, params, enabled),
    categories = useExpensesByCategory(workspace.id, params, enabled),
    cashFlow = useCashFlow(workspace.id, { ...params, groupBy }, enabled),
    balances = useAccountBalancesReport(
      workspace.id,
      { page: 1, limit: 100 },
      canRead,
    )
  const changeParams = (next: ReportParams) => {
    const compatible = groupsForPeriod(next.period, next)
    setParams(next)
    if (!compatible.includes(groupBy)) setGroupBy(compatible[0]!)
  }
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar reportes en este workspace."
      />
    )
  return (
    <div className={styles.page}>
      <div className={styles.screenOnly}>
        <PageHeader
          title="Reportes"
          description="Analiza cómo se comportan tus ingresos, gastos y cuentas."
          actions={
            <Button onClick={() => window.print()}>
              <Printer size={18} aria-hidden="true" /> Imprimir reporte
            </Button>
          }
        />
      </div>
      <header className={styles.printHeader}>
        <strong>{APP_NAME}</strong>
        <h1>Reporte financiero</h1>
        <p>
          Periodo: {income.data?.period.dateFrom.slice(0, 10) ?? '—'} —{' '}
          {income.data?.period.dateTo.slice(0, 10) ?? '—'}
        </p>
        <p>
          Moneda:{' '}
          {income.data?.summariesByCurrency
            .map((item) => item.currency)
            .join(', ') || 'Sin datos'}
        </p>
        <p>
          Generado:{' '}
          {new Intl.DateTimeFormat('es-CO', {
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(new Date())}
        </p>
      </header>
      <div className={styles.screenOnly}>
        <FilterPanel
          active={params.period !== 'CURRENT_MONTH' || groupBy !== 'DAY'}
        >
          <ReportsPeriodFilter
            value={params}
            onChange={changeParams}
            groupBy={groupBy}
            onGroupChange={setGroupBy}
          />
        </FilterPanel>
        {rangeError && <p role="alert">{rangeError}</p>}
      </div>
      {validRange && (
        <>
          <ReportSection title="Ingresos frente a gastos" query={income}>
            {income.data && <IncomeVsExpensesReport data={income.data} />}
          </ReportSection>
          <ReportSection title="Gastos por categoría" query={categories}>
            {categories.data && (
              <ExpensesByCategoryReport data={categories.data} />
            )}
          </ReportSection>
          <ReportSection title="Flujo de caja y evolución" query={cashFlow}>
            {cashFlow.data && (
              <CashFlowReport
                data={cashFlow.data}
                timezone={workspace.timezone}
              />
            )}
          </ReportSection>
          <ReportSection title="Saldos por cuenta" query={balances}>
            {balances.data && <AccountBalancesReport data={balances.data} />}
          </ReportSection>
        </>
      )}
    </div>
  )
}
