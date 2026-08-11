import styles from './feedback.module.css'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  label?: string
  size?: 'small' | 'medium'
}

export function LoadingSpinner({
  label = 'Cargando',
  size = 'medium',
}: LoadingSpinnerProps) {
  return (
    <span
      className={clsx(styles.spinner, size === 'small' && styles.spinnerSmall)}
      role="status"
      aria-label={label}
    />
  )
}
