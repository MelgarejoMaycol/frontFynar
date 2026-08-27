import { Button, Input, Select } from '@/components/ui'
import { dashboardPeriodLabels } from '../dashboard.constants'
import {
  dashboardPeriods,
  type DashboardParams,
  type DashboardPeriod,
} from '../types/dashboard.types'
import styles from './dashboard.module.css'
export function DashboardPeriodFilter({
  value,
  onChange,
  error,
  financialCycleConfigured,
  onConfigureCycle,
}: {
  value: DashboardParams
  onChange: (value: DashboardParams) => void
  error?: string
  financialCycleConfigured: boolean
  onConfigureCycle: () => void
}) {
  const changePeriod = (period: DashboardPeriod) =>
    onChange(
      period === 'CUSTOM'
        ? {
            period,
            recentLimit: value.recentLimit,
            dateFrom: value.dateFrom ?? '',
            dateTo: value.dateTo ?? '',
          }
        : { period, recentLimit: value.recentLimit },
    )
  return (
    <div className={styles.periodFilter}>
      <label>
        Periodo
        <Select
          value={value.period}
          onChange={(event) =>
            changePeriod(event.target.value as DashboardPeriod)
          }
        >
          {dashboardPeriods.filter((period) => period !== 'MY_CYCLE' || financialCycleConfigured).map((period) => (
            <option key={period} value={period}>
              {dashboardPeriodLabels[period]}
            </option>
          ))}
        </Select>
      </label>
      {value.period === 'CUSTOM' && (
        <>
          <label>
            Desde
            <Input
              type="date"
              value={value.dateFrom ?? ''}
              onChange={(event) =>
                onChange({ ...value, dateFrom: event.target.value })
              }
            />
          </label>
          <label>
            Hasta
            <Input
              type="date"
              value={value.dateTo ?? ''}
              onChange={(event) =>
                onChange({ ...value, dateTo: event.target.value })
              }
            />
          </label>
        </>
      )}
      {!financialCycleConfigured && (
        <div className={styles.cycleSetup}>
          <span>Define tu ciclo financiero para usarlo como período inicial.</span>
          <Button type="button" variant="secondary" onClick={onConfigureCycle}>
            Configurar Mi ciclo
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
