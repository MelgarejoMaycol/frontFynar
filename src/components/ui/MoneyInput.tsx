import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
import {
  canonicalMoneyInput,
  formatMoneyInput,
  normalizeMoneyInput,
  moneyFromMinorUnitInput,
} from './money-input.utils'

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  value?: string
  onValueChange?: (value: string) => void
  currency?: string
  minorUnits?: boolean
}
export const MoneyInput = forwardRef<HTMLInputElement, Props>(
  function MoneyInput(
    {
      value,
      defaultValue,
      onValueChange,
      className,
      name,
      currency,
      disabled,
      minorUnits = false,
      ...props
    },
    forwardedRef,
  ) {
    const controlled = value !== undefined
    const [internalValue, setInternalValue] = useState(() =>
      normalizeMoneyInput(defaultValue == null ? '' : String(defaultValue)),
    )
    const [focused, setFocused] = useState(false)
    const normalized = controlled ? value : internalValue
    const displayValue = minorUnits
      ? formatMoneyInput(normalized)
      : focused
      ? normalized
          .replace(/\.00$/, '')
          .replace(/(\.\d)0$/, '$1')
          .replace('.', ',')
      : formatMoneyInput(normalized)
    return (
      <>
        <input
          {...props}
          ref={(node) => {
            if (typeof forwardedRef === 'function') forwardedRef(node)
            else if (forwardedRef) forwardedRef.current = node
          }}
          type="text"
          className={clsx(styles.control, className)}
          inputMode={minorUnits ? 'numeric' : 'decimal'}
          data-currency={currency}
          autoComplete={props.autoComplete ?? 'off'}
          disabled={disabled}
          value={displayValue}
          onFocus={(event) => {
            setFocused(true)
            props.onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            const canonical = canonicalMoneyInput(normalized)
            onValueChange?.(canonical)
            props.onBlur?.(event)
          }}
          onChange={(event) => {
            const next = minorUnits
              ? moneyFromMinorUnitInput(event.target.value)
              : normalizeMoneyInput(event.target.value)
            if (!controlled) setInternalValue(next)
            onValueChange?.(next)
          }}
        />
        {name && (
          <input
            type="hidden"
            name={name}
            value={canonicalMoneyInput(normalized)}
            disabled={disabled}
          />
        )}
      </>
    )
  },
)
