import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'
import styles from './surfaces.module.css'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}
export function Dialog({ open, title, children, footer, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
      document.body.style.overflow = 'hidden'
      dialog
        .querySelector<HTMLElement>('button, [href], input, select, textarea')
        ?.focus()
    }
    if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
    return () => {
      document.body.style.overflow = ''
      if (open) previous?.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <header className={styles.dialogHeader}>
        <h2 id={titleId}>{title}</h2>
        <IconButton aria-label="Cerrar diálogo" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </header>
      <div className={styles.dialogBody}>{children}</div>
      {footer && <footer className={styles.dialogFooter}>{footer}</footer>}
    </dialog>
  )
}
