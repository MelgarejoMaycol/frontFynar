import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
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
  const location = useLocation()
  const navigate = useNavigate()
  const isCommitmentTool =
    location.pathname.startsWith('/app/lending') ||
    location.pathname.startsWith('/app/personal-balances')

  return (
    <header className={styles.pageHeader}>
      <div>
        {isCommitmentTool ? (
          <Button
            type="button"
            variant="ghost"
            size="small"
            onClick={() => navigate('/app/commitments')}
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
