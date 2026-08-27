import type { ReactNode } from 'react'
import { Button } from './Button'
import { Dialog } from './Dialog'

export function ConfirmDeleteDialog({
  open,
  title,
  name,
  description,
  details,
  confirmLabel = 'Eliminar',
  question = '¿Estás seguro de que quieres eliminar',
  pending = false,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  name: string
  description?: string
  details?: ReactNode
  confirmLabel?: string
  question?: string
  pending?: boolean
  error?: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog
      open={open}
      title={title}
      onClose={() => !pending && onClose()}
      footer={
        <>
          <Button variant="secondary" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" loading={pending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>
        {question} <strong>“{name}”</strong>?
      </p>
      <p>
        {description ??
          'Si no tiene historial se eliminará definitivamente. Si tiene información financiera, se conservará su historial de forma segura.'}
      </p>
      {details}
      {error && <p role="alert">{error}</p>}
    </Dialog>
  )
}
