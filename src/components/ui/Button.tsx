import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
import { Spinner } from './Spinner'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
      aria-label={
        props['aria-label'] ??
        (loading && typeof children === 'string' ? children : undefined)
      }
    >
      <span className={clsx(loading && styles.buttonContentHidden)}>
        {children}
      </span>
      {loading && (
        <span className={styles.buttonLoader}>
          <Spinner size="small" decorative />
        </span>
      )}
    </button>
  )
}
