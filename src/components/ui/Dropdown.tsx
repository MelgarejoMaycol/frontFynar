import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import styles from './surfaces.module.css'
export function Dropdown({
  trigger,
  children,
  label,
}: {
  trigger: ReactNode
  children: ReactNode
  label: string
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        ref.current?.removeAttribute('open')
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !ref.current?.open) return
      ref.current.removeAttribute('open')
      ref.current.querySelector('summary')?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])
  return (
    <details
      ref={ref}
      className={styles.dropdown}
      data-ui-dropdown
      onToggle={() => {
        if (!ref.current?.open) return
        document.querySelectorAll<HTMLDetailsElement>('details[data-ui-dropdown][open]').forEach((item) => {
          if (item !== ref.current) item.removeAttribute('open')
        })
      }}
    >
      <summary aria-label={label}>{trigger}</summary>
      <div
        className={styles.dropdownMenu}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('a, button')) {
            ref.current?.removeAttribute('open')
          }
        }}
      >
        {children}
      </div>
    </details>
  )
}

export function DropdownAction({
  danger = false,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type={type}
      className={`${styles.dropdownAction} ${danger ? styles.dropdownDanger : ''} ${className}`.trim()}
      {...props}
    />
  )
}
