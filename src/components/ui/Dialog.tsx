import { useEffect, useId, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'
import styles from './surfaces.module.css'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'default' | 'wide'
  onClose: () => void
}

export function Dialog({
  open,
  title,
  children,
  footer,
  size = 'default',
  onClose,
}: Props) {
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

      if (typeof dialog.animate === 'function') {
        dialog.getAnimations().forEach((animation) => animation.cancel())
        dialog.animate(
          [
            {
              opacity: 0,
              transform: 'translateY(min(18vh, 8rem)) scale(0.97)',
            },
            {
              opacity: 1,
              transform: 'translateY(0) scale(1)',
            },
          ],
          {
            duration: 420,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          },
        )
      }

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
      className={clsx(styles.dialog, size === 'wide' && styles.dialogWide)}
      aria-labelledby={titleId}
      style={
        open
          ? {
              display: 'flex',
              flexDirection: 'column',
            }
          : undefined
      }
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
      <div
        className={styles.dialogBody}
        style={{ minHeight: 0, flex: '1 1 auto' }}
      >
        {children}
      </div>
      {footer && <footer className={styles.dialogFooter}>{footer}</footer>}
    </dialog>
  )
}
