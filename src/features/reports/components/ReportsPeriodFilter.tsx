import { Input, Select } from '@/components/ui'
import { reportPeriodLabels } from '../reports.constants'
import {
  reportPeriods,
  type ReportGroup,
  type ReportParams,
  type ReportPeriod,
} from '../types/report.types'
import { groupsForPeriod } from '../reports.validation'
import styles from './reports.module.css'
export function ReportsPeriodFilter({
  value,
  onChange,
  groupBy,
  onGroupChange,
}: {
  value: ReportParams
  onChange: (value: ReportParams) => void
  groupBy: ReportGroup
  onGroupChange: (value: ReportGroup) => void
}) {
  const groups = groupsForPeriod(value.period, value)
  return (
    <div className={styles.filters}>
      <label>
        Periodo
        <Select
          value={value.period}
          onChange={(event) => {
            const period = event.target.value as ReportPeriod
            onChange(
              period === 'CUSTOM'
                ? {
                    ...value,
                    period,
                    dateFrom: value.dateFrom ?? '',
                    dateTo: value.dateTo ?? '',
                  }
                : { period },
            )
          }}
        >
          {reportPeriods.map((period) => (
            <option key={period} value={period}>
              {reportPeriodLabels[period]}
            </option>
          ))}
        </Select>
      </label>
      {value.period === 'CUSTOM' && (
        <>
          <label>
            Desde
            <Input
              aria-label="Desde"
              type="date"
              value={value.dateFrom ?? ''}
              onChange={(e) => onChange({ ...value, dateFrom: e.target.value })}
            />
          </label>
          <label>
            Hasta
            <Input
              aria-label="Hasta"
              type="date"
              value={value.dateTo ?? ''}
              onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
            />
          </label>
        </>
      )}
      <label>
        Agrupar por
        <Select
          value={groupBy}
          onChange={(event) => onGroupChange(event.target.value as ReportGroup)}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {{ DAY: 'Día', WEEK: 'Semana', MONTH: 'Mes' }[group]}
            </option>
          ))}
        </Select>
      </label>
    </div>
  )
}
