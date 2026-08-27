import { Children, cloneElement, isValidElement, type ReactNode } from 'react'
import styles from './controls.module.css'
type Props = {
  label: string
  htmlFor: string
  required?: boolean
  helpText?: string
  error?: string
  children: ReactNode
}
export function FormField({
  label,
  htmlFor,
  required,
  helpText,
  error,
  children,
}: Props) {
  const helpId = `${htmlFor}-help`
  const errorId = `${htmlFor}-error`
  const childList = Children.toArray(children)
  const control = childList[0]
  if (!isValidElement<Record<string, unknown>>(control)) {
    throw new Error('FormField requiere un control de formulario como primer hijo')
  }
  const describedBy = [
    control.props['aria-describedby'],
    helpText && helpId,
    error && errorId,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}{' '}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {cloneElement(control, {
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : control.props['aria-invalid'],
        'aria-required': required || control.props['aria-required'],
      })}
      {childList.slice(1)}
      {helpText && (
        <p className={styles.help} id={helpId}>
          {helpText}
        </p>
      )}
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
