import type { ComponentPropsWithRef, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
type Props = ComponentPropsWithRef<'button'> & {
  'aria-label': string
  children: ReactNode
}
export function IconButton({ children, className, ...props }: Props) {
  return (
    <button
      type="button"
      className={clsx(styles.iconButton, className)}
      {...props}
    >
      {children}
    </button>
  )
}
