import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import styles from './controls.module.css'
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, ...props }, ref) {
  return (
    <span className={styles.selectWrap}>
      <select
        ref={ref}
        className={clsx(styles.control, styles.selectControl, className)}
        {...props}
      />
      <ChevronDown className={styles.selectIcon} size={18} aria-hidden="true" />
    </span>
  )
})
