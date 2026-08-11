import { cloneElement, type ReactElement } from 'react'
import styles from './controls.module.css'
type Props = {
  label: string
  htmlFor: string
  required?: boolean
  helpText?: string
  error?: string
  children: ReactElement<{
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-required'?: boolean
  }>
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
  const describedBy = [
    children.props['aria-describedby'],
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
      {cloneElement(children, {
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-required': required || children.props['aria-required'],
      })}
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
