import { ArrowRight, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { Button, PageHeader } from '@/components/ui'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { useFinancialHealth } from './hooks'
import type {
  FinancialHealthBand,
  FinancialHealthDimension,
} from './types'
import styles from './financial-health.module.css'

const bandLabel: Record<FinancialHealthBand, string> = {
  SOLID: 'Sólida',
  STABLE: 'Estable',
  ATTENTION: 'Requiere atención',
  FRAGILE: 'Frágil',
  INSUFFICIENT: 'Datos insuficientes',
}

const metricLabel: Record<string, string> = {
  liquidAvailable: 'Liquidez disponible',
  monthlyExpenseReference: 'Gasto mensual de referencia',
  coverageMonths: 'Meses de cobertura',
  totalDebt: 'Deuda activa',
  monthlyIncomeReference: 'Ingreso mensual de referencia',
  debtToAnnualIncome: 'Deuda / ingreso anual',
  budgetAmount: 'Presupuesto total',
  projectedBudgetSpend: 'Gasto proyectado',
  projectedUtilization: 'Uso proyectado',
  periodIncome: 'Ingresos del periodo',
  periodExpenses: 'Gastos del periodo',
  netSavingsFlow: 'Flujo de ahorro',
  savingsRate: 'Tasa de ahorro',
  paymentsDue: 'Vencimientos evaluados',
  paymentsOnTime: 'Pagados a tiempo',
  paymentsLateOrMissed: 'Tardíos o pendientes',
  onTimeRate: 'Cumplimiento a tiempo',
}

const percentageMetrics = new Set([
  'debtToAnnualIncome',
  'projectedUtilization',
  'savingsRate',
  'onTimeRate',
])

const moneyMetrics = new Set([
  'liquidAvailable',
  'monthlyExpenseReference',
  'totalDebt',
  'monthlyIncomeReference',
  'budgetAmount',
  'projectedBudgetSpend',
  'periodIncome',
  'periodExpenses',
  'netSavingsFlow',
])

function formatMetric(
  key: string,
  value: string | number | null,
  currency: string,
) {
  if (value === null) return 'No disponible'
  if (percentageMetrics.has(key) && typeof value === 'number')
    return `${(value * 100).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`
  if (moneyMetrics.has(key)) {
    const numeric = Number(value)
    if (Number.isFinite(numeric))
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(numeric)
  }
  if (typeof value === 'number') return value.toLocaleString('es-CO')
  return value
}

function DimensionCard({
  dimension,
  currency,
  onNavigate,
}: {
  dimension: FinancialHealthDimension
  currency: string
  onNavigate: (url: string) => void
}) {
  return (
    <article
      className={styles.dimension}
      aria-labelledby={`dimension-${dimension.id}`}
    >
      <div className={styles.dimensionHeader}>
        <div>
          <h3
            className={styles.dimensionTitle}
            id={`dimension-${dimension.id}`}
          >
            {dimension.label}
          </h3>
          <span className={styles.statusText}>
            {bandLabel[dimension.status]}
          </span>
        </div>
        <div
          className={styles.dimensionScore}
          aria-label={`Puntuación ${dimension.label}`}
        >
          {dimension.score === null ? '—' : `${dimension.score}/100`}
        </div>
      </div>
      <p className={styles.summary}>{dimension.summary}</p>
      <details className={styles.details}>
        <summary>Ver cómo se calculó</summary>
        <div className={styles.detailsContent}>
          <p>{dimension.explanation}</p>
          <dl className={styles.metrics}>
            {Object.entries(dimension.metrics).map(([key, value]) => (
              <div className={styles.metric} key={key}>
                <dt>{metricLabel[key] ?? key}</dt>
                <dd>{formatMetric(key, value, currency)}</dd>
              </div>
            ))}
          </dl>
          {dimension.action && (
            <Button
              variant="secondary"
              onClick={() => onNavigate(dimension.action!.url)}
            >
              {dimension.action.label}{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </details>
    </article>
  )
}

export function FinancialHealthPage() {
  const navigate = useNavigate()
  const workspace = useActiveWorkspace().activeWorkspace!
  const canRead = usePermission('reports.read')
  const health = useFinancialHealth(workspace.id, canRead)

  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        message="No tienes permiso para consultar la salud financiera de este workspace."
      />
    )

  if (health.isPending) return <PageLoader />
  if (health.isError)
    return (
      <ErrorState
        title="No pudimos calcular tu salud financiera"
        message="Intenta nuevamente. Tus datos financieros no fueron modificados."
        onRetry={() => void health.refetch()}
      />
    )
  if (!health.data) return null

  const data = health.data
  return (
    <main className={styles.page} aria-label="Salud financiera">
      <PageHeader
        title="Salud financiera"
        description="Una lectura explicable de tus datos actuales para entender dónde estás y qué merece atención."
      />

      <section
        className={styles.hero}
        aria-label="Puntuación general de salud financiera"
      >
        <div className={styles.panel}>
          <h2>Tu panorama actual</h2>
          <p>
            La puntuación reúne únicamente las dimensiones que Fynar puede
            calcular con datos reales suficientes. La fórmula actual es{' '}
            <strong>{data.version}</strong>.
          </p>
          <p className={styles.disclaimer}>{data.methodology.disclaimer}</p>
          {data.dataQuality.notes.length > 0 && (
            <ul
              className={styles.qualityNotes}
              aria-label="Limitaciones de datos"
            >
              {data.dataQuality.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.scoreCard}>
          <div className={styles.score}>
            {data.score === null ? '—' : data.score}
            {data.score !== null && (
              <span className={styles.scoreSuffix}>/100</span>
            )}
          </div>
          <p className={styles.band}>{bandLabel[data.band]}</p>
          <p className={styles.coverage}>
            {data.availableDimensions} de 5 dimensiones · {data.coverage}% de
            cobertura
          </p>
          <Button variant="secondary" onClick={() => void health.refetch()}>
            <RefreshCw size={16} aria-hidden="true" /> Recalcular
          </Button>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="dimensions-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="dimensions-heading">Tus cinco dimensiones</h2>
            <p>
              Cada una muestra factores, datos usados y una explicación
              independiente.
            </p>
          </div>
        </div>
        <div className={styles.dimensions}>
          {data.dimensions.map((dimension) => (
            <DimensionCard
              key={dimension.id}
              dimension={dimension}
              currency={data.currency}
              onNavigate={navigate}
            />
          ))}
        </div>
      </section>

      <section
        className={styles.panel}
        aria-labelledby="recommendations-heading"
      >
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="recommendations-heading">Acciones que puedes revisar</h2>
            <p>
              Se muestran solo cuando están vinculadas con una métrica concreta.
            </p>
          </div>
        </div>
        {data.recommendations.length === 0 ? (
          <p>
            No hay una dimensión con prioridad alta que requiera una acción
            inmediata.
          </p>
        ) : (
          <div className={styles.recommendations}>
            {data.recommendations.map((recommendation) => (
              <article
                className={styles.recommendation}
                key={recommendation.dimension}
              >
                <h3>{recommendation.title}</h3>
                <p>{recommendation.detail}</p>
                <Button
                  variant="secondary"
                  onClick={() => navigate(recommendation.action.url)}
                >
                  {recommendation.action.label}{' '}
                  <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.panel} aria-labelledby="history-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="history-heading">Evolución</h2>
            <p>{data.history.message}</p>
          </div>
        </div>
        {data.history.hasEnoughHistory ? (
          <div className={styles.history}>
            {data.history.items.map((snapshot) => (
              <article className={styles.historyCard} key={snapshot.period}>
                <h3>{snapshot.period}</h3>
                <div className={styles.historyScore}>{snapshot.score}/100</div>
                <p>{bandLabel[snapshot.band]}</p>
                <p>{snapshot.coverage}% de cobertura</p>
              </article>
            ))}
          </div>
        ) : (
          <p role="status">
            Aún no hay suficientes periodos comparables. Fynar no inventará una
            tendencia hasta contar con al menos {data.history.minimumPeriods}{' '}
            periodos de la misma versión.
          </p>
        )}
      </section>

      <section
        className={styles.methodology}
        aria-labelledby="methodology-heading"
      >
        <h2 id="methodology-heading">Cómo funciona la versión actual</h2>
        <p>{data.methodology.aggregation}</p>
        <ul>
          {data.methodology.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
    </main>
  )
}
