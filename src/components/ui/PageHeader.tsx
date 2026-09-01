import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'
import styles from './surfaces.module.css'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  const pathname = typeof window === 'undefined' ? '' : window.location.pathname
  const isCommitmentTool =
    pathname.startsWith('/app/lending') ||
    pathname.startsWith('/app/personal-balances')

  return (
    <header className={styles.pageHeader}>
      <div>
        {isCommitmentTool ? (
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={() => window.location.assign('/app/commitments')}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Volver a créditos, deudas y cobros
          </Button>
        ) : null}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions}
    </header>
  )
}
