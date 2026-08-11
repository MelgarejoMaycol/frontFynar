import { useRef, type ReactNode } from 'react'
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
  return (
    <details ref={ref} className={styles.dropdown}>
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
