import type { TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './controls.module.css'
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx(styles.control, className)} {...props} />
}
