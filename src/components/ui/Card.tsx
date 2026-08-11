import type { HTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './surfaces.module.css'
export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { raised?: boolean }) {
  const { raised, ...rest } = props
  return (
    <div
      className={clsx(styles.card, raised && styles.raised, className)}
      {...rest}
    />
  )
}
