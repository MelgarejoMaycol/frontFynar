import { cloneElement, useId, type ReactElement } from 'react'
import styles from './surfaces.module.css'
export function Tooltip({
  label,
  children,
}: {
  label: string
  children: ReactElement<{ 'aria-describedby'?: string }>
}) {
  const id = useId()
  return (
    <span className={styles.tooltipWrap}>
      {cloneElement(children, {
        'aria-describedby':
          [children.props['aria-describedby'], id].filter(Boolean).join(' ') ||
          undefined,
      })}
      <span id={id} role="tooltip" className={styles.tooltip}>
        {label}
      </span>
    </span>
  )
}
