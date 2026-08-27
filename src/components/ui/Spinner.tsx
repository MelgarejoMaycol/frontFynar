import clsx from 'clsx'
import styles from './spinner.module.css'

export function Spinner({
  size = 'medium',
  label,
  decorative = false,
}: {
  size?: 'small' | 'medium' | 'large'
  label?: string
  decorative?: boolean
}) {
  return (
    <span
      className={clsx(styles.spinner, styles[size])}
      role={decorative ? undefined : 'status'}
      aria-label={decorative ? undefined : (label ?? 'Cargando')}
      aria-hidden={decorative || undefined}
    />
  )
}
