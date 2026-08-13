import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
import { formatMoneyInput, normalizeMoneyInput } from './money-input.utils'

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> & {
  value?: string
  onValueChange?: (value: string) => void
}
export const MoneyInput = forwardRef<HTMLInputElement, Props>(
  function MoneyInput(
    { value, onValueChange, className, onBlur, ...props },
    ref,
  ) {
    return (
      <input
        {...props}
        ref={ref}
        className={clsx(styles.control, className)}
        inputMode="decimal"
        value={value === undefined ? undefined : formatMoneyInput(value)}
        onChange={(event) => {
          const normalized = normalizeMoneyInput(event.target.value)
          onValueChange?.(normalized)
        }}
        onBlur={onBlur}
      />
    )
  },
)
