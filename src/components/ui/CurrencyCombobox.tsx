import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { currencies } from './currencies'
import styles from './controls.module.css'

export const CurrencyCombobox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'list'>
>(function CurrencyCombobox({ className, onChange, ...props }, ref) {
  const listId = useId()
  return (
    <>
      <input
        {...props}
        ref={ref}
        className={clsx(styles.control, className)}
        list={listId}
        maxLength={3}
        autoComplete="off"
        onChange={(event) => {
          event.currentTarget.value = event.currentTarget.value.toUpperCase()
          onChange?.(event)
        }}
      />
      <datalist id={listId}>
        {currencies.map(([code, name]) => (
          <option key={code} value={code}>{`${code} — ${name}`}</option>
        ))}
      </datalist>
    </>
  )
})
