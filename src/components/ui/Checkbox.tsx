import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './controls.module.css'
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}
export function Checkbox({ label, ...props }: Props) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
