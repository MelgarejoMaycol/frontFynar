import { Input, Select } from '@/components/ui'
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
}: {
  value: DashboardParams
  onChange: (value: DashboardParams) => void
  error?: string
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
          {dashboardPeriods.map((period) => (
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
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
