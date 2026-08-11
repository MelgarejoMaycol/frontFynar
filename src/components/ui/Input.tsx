import type { ComponentPropsWithRef } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
export function Input({
  className,
  'aria-invalid': invalid,
  ...props
}: ComponentPropsWithRef<'input'>) {
  return (
    <input
      className={clsx(
        styles.control,
        invalid && styles.controlInvalid,
        className,
      )}
      aria-invalid={invalid}
      {...props}
    />
  )
}
