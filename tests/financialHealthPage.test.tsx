import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FinancialHealthPage } from '@/features/financial-health/FinancialHealthPage'

const mocks = vi.hoisted(() => ({
  health: vi.fn(),
  permission: vi.fn(),
}))

vi.mock('@/features/financial-health/hooks', () => ({
  useFinancialHealth: (...args: unknown[]) => mocks.health(...args),
}))

vi.mock('@/features/workspace', () => ({
  useActiveWorkspace: () => ({
    activeWorkspace: {
      id: 'workspace-1',
      baseCurrency: 'COP',
      timezone: 'America/Bogota',
    },
  }),
  usePermission: (...args: unknown[]) => mocks.permission(...args),
}))

const response = {
  version: 'financial-health-v1',
  score: 72,
  band: 'STABLE' as const,
  coverage: 80,
  availableDimensions: 4,
  currency: 'COP',
  period: {
    key: '2026-09',
    dateFrom: '2026-09-01',
    dateTo: '2026-09-30',
    generatedAt: '2026-09-04T12:00:00.000Z',
    timezone: 'America/Bogota',
  },
  dimensions: [
    {
      id: 'LIQUIDITY' as const,
      label: 'Liquidez',
      score: 68,
      available: true,
      status: 'STABLE' as const,
      summary: 'La liquidez cubre aproximadamente 2 meses de gasto.',
      explanation: 'Se compara dinero líquido disponible con gasto mensual de referencia.',
      metrics: {
        liquidAvailable: '2000000.00',
        monthlyExpenseReference: '1000000.00',
        coverageMonths: 2,
      },
      action: { label: 'Revisar cuentas', url: '/app/accounts' },
    },
    {
      id: 'DEBT' as const,
      label: 'Endeudamiento',
      score: 80,
      available: true,
      status: 'SOLID' as const,
      summary: 'La deuda es manejable frente al ingreso de referencia.',
      explanation: 'Se compara deuda activa con ingreso anualizado.',
      metrics: { totalDebt: '3000000.00', debtToAnnualIncome: 0.2 },
      action: null,
    },
    {
      id: 'SPENDING_CONTROL' as const,
      label: 'Control del gasto',
      score: null,
      available: false,
      status: 'INSUFFICIENT' as const,
      summary: 'No hay presupuestos activos aplicables al periodo actual.',
      explanation: 'No se inventa un límite de gasto.',
      metrics: { budgetAmount: '0.00', projectedUtilization: null },
      action: { label: 'Crear o revisar presupuestos', url: '/app/budgets' },
    },
    {
      id: 'SAVINGS' as const,
      label: 'Ahorro',
      score: 70,
      available: true,
      status: 'STABLE' as const,
      summary: 'Existe margen de ahorro en el periodo.',
      explanation: 'Se usa flujo confirmado del periodo.',
      metrics: { savingsRate: 0.14 },
      action: null,
    },
    {
      id: 'PAYMENT_COMPLIANCE' as const,
      label: 'Cumplimiento de pagos',
      score: 70,
      available: true,
      status: 'STABLE' as const,
      summary: 'La mayoría de los vencimientos se pagaron a tiempo.',
      explanation: 'Se revisan vencimientos de los últimos 90 días.',
      metrics: { paymentsDue: 10, paymentsOnTime: 7, onTimeRate: 0.7 },
      action: null,
    },
  ],
  recommendations: [
    {
      dimension: 'LIQUIDITY' as const,
      title: 'Fortalecer la liquidez disponible',
      detail: 'Revisa cuánto dinero está libre después de reservas.',
      action: { label: 'Revisar cuentas', url: '/app/accounts' },
    },
  ],
  methodology: {
    version: 'financial-health-v1',
    aggregation: 'Promedio simple de las dimensiones disponibles.',
    rules: ['Liquidez: cobertura de hasta 3 meses.', 'Ahorro: 20% alcanza el máximo.'],
    disclaimer:
      'La salud financiera de Fynar es un indicador educativo. No es un score crediticio ni un diagnóstico o recomendación financiera profesional.',
  },
  dataQuality: {
    historyDays: 60,
    trailingWindowDays: 90,
    budgetCount: 0,
    evaluatedPayments: 10,
    notes: ['Control del gasto queda sin puntuar hasta que exista un presupuesto activo.'],
  },
  trace: {},
  history: {
    items: [
      {
        kind: 'FINANCIAL_HEALTH_SNAPSHOT' as const,
        period: '2026-09',
        generatedAt: '2026-09-04T12:00:00.000Z',
        score: 72,
        band: 'STABLE' as const,
        coverage: 80,
        availableDimensions: 4,
        dimensions: [],
      },
    ],
    hasEnoughHistory: false,
    minimumPeriods: 2,
    message: 'El histórico aparecerá cuando existan al menos dos periodos evaluados.',
  },
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <FinancialHealthPage />
    </MemoryRouter>,
  )

describe('FinancialHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.permission.mockReturnValue(true)
    mocks.health.mockReturnValue({
      isPending: false,
      isError: false,
      data: response,
      refetch: vi.fn(),
    })
  })

  it('muestra score, cinco dimensiones y disclaimer sin depender solo del color', () => {
    renderPage()
    expect(screen.getByText('72')).toBeVisible()
    expect(screen.getByText('Estable')).toBeVisible()
    expect(screen.getByText(/4 de 5 dimensiones/)).toBeVisible()
    expect(screen.getByText('Liquidez')).toBeVisible()
    expect(screen.getByText('Endeudamiento')).toBeVisible()
    expect(screen.getByText('Control del gasto')).toBeVisible()
    expect(screen.getByText('Ahorro')).toBeVisible()
    expect(screen.getByText('Cumplimiento de pagos')).toBeVisible()
    expect(screen.getAllByText('Datos insuficientes').length).toBeGreaterThan(0)
    expect(screen.getByText(/No es un score crediticio/i)).toBeVisible()
  })

  it('permite abrir la evidencia y muestra métricas reales', () => {
    renderPage()
    fireEvent.click(screen.getAllByText('Ver cómo se calculó')[0]!)
    expect(screen.getByText('Liquidez disponible')).toBeVisible()
    expect(screen.getByText(/2\.000\.000/)).toBeVisible()
    expect(screen.getByText('Meses de cobertura')).toBeVisible()
    expect(screen.getByRole('button', { name: /Revisar cuentas/i })).toBeVisible()
  })

  it('explica por qué todavía no muestra tendencia histórica', () => {
    renderPage()
    expect(screen.getByText(/Aún no hay suficientes periodos comparables/i)).toBeVisible()
    expect(screen.getByText(/al menos 2 periodos/i)).toBeVisible()
  })

  it('respeta permiso reports.read', () => {
    mocks.permission.mockReturnValue(false)
    renderPage()
    expect(screen.getByText('Acceso restringido')).toBeVisible()
  })
})
