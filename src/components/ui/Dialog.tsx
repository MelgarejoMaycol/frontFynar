import { useEffect, useId, useRef, type ReactNode } from 'react'
import clsx from 'clsx'
import {
  Archive,
  ArrowLeftRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Landmark,
  Pencil,
  Settings2,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { IconButton } from './IconButton'
import styles from './surfaces.module.css'
import './dialog.mobile.css'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'default' | 'wide'
  onClose: () => void
}

type DialogVisual = {
  Icon: LucideIcon
  eyebrow: string
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

function getDialogVisual(title: string): DialogVisual {
  const value = title.toLocaleLowerCase('es')

  if (/eliminar|borrar/.test(value)) {
    return { Icon: Trash2, eyebrow: 'Acción irreversible', tone: 'danger' }
  }

  if (/archiv|restaur/.test(value)) {
    return { Icon: Archive, eyebrow: 'Organización', tone: 'warning' }
  }

  if (/editar|modificar|actualizar/.test(value)) {
    return { Icon: Pencil, eyebrow: 'Edición', tone: 'info' }
  }

  if (/configur|preferenc|ajuste/.test(value)) {
    return { Icon: Settings2, eyebrow: 'Configuración', tone: 'info' }
  }

  if (/tarjeta/.test(value)) {
    return { Icon: CreditCard, eyebrow: 'Tarjetas', tone: 'primary' }
  }

  if (/movimiento|transfer|transacci/.test(value)) {
    return { Icon: ArrowLeftRight, eyebrow: 'Movimiento financiero', tone: 'success' }
  }

  if (/cuenta|saldo/.test(value)) {
    return { Icon: Landmark, eyebrow: 'Cuentas', tone: 'primary' }
  }

  if (/pago|deuda|cobro|crédito|credito|préstamo|prestamo/.test(value)) {
    return { Icon: CircleDollarSign, eyebrow: 'Finanzas', tone: 'success' }
  }

  return { Icon: FileText, eyebrow: 'Fynar', tone: 'primary' }
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
  const visual = getDialogVisual(title)
  const { Icon } = visual

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

      const canAutoFocus =
        typeof window.matchMedia !== 'function' ||
        window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (canAutoFocus) {
        dialog
          .querySelector<HTMLElement>('button, [href], input, select, textarea')
          ?.focus()
      }
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
      data-fynar-dialog
      className={clsx(
        styles.dialog,
        styles[`dialogTone${visual.tone[0].toUpperCase()}${visual.tone.slice(1)}`],
        size === 'wide' && styles.dialogWide,
      )}
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
        <div className={styles.dialogHeaderContent}>
          <span className={styles.dialogIcon} aria-hidden="true">
            <Icon size={23} strokeWidth={2.1} />
          </span>
          <div className={styles.dialogHeading}>
            <span className={styles.dialogEyebrow}>{visual.eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>
        <IconButton aria-label="Cerrar diálogo" onClick={onClose}>
          <X size={20} />
        </IconButton>
        <Icon className={styles.dialogWatermark} size={150} strokeWidth={1.15} aria-hidden="true" />
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
