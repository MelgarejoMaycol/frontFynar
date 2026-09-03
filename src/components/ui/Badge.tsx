import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './surfaces.module.css'
export function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'error'
}) {
  return (
    <span
      className={clsx(
        styles.badge,
        tone !== 'neutral' && styles[tone],
        className,
      )}
      data-tone={tone}
      {...props}
    />
  )
}
