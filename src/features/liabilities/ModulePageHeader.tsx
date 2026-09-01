import type { ReactNode } from 'react'
import { CalendarClock, CreditCard, HandCoins, Landmark } from 'lucide-react'
import styles from './liabilities.module.css'
import './liabilities-redesign.css'

function defaultHeaderIcon(title: string) {
  const normalized = title.toLowerCase()

  if (normalized.includes('tarjeta')) return <CreditCard size={26} />
  if (normalized.includes('pago') || normalized.includes('obligación'))
    return <CalendarClock size={26} />
  if (normalized.includes('crédito') || normalized.includes('préstamo'))
    return <HandCoins size={26} />

  return <Landmark size={26} />
}

export function ModulePageHeader({
  title,
  subtitle,
  description,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  const supportingText = subtitle ?? description
  const visualIcon = icon ?? defaultHeaderIcon(title)

  return (
    <header className={styles.moduleHeader} data-liabilities-header>
      <div className={styles.moduleHeading}>
        <span data-liabilities-icon aria-hidden="true">
          {visualIcon}
        </span>
        <div>
          <h1>{title}</h1>
          {supportingText && <p>{supportingText}</p>}
        </div>
      </div>
      {actions && <div className={styles.moduleActions}>{actions}</div>}
    </header>
  )
}
