import { useState } from 'react'
import { Button, Dialog, FormField, MoneyInput } from '@/components/ui'
import { useAdjustBalance } from '@/features/transactions/hooks/transactions.hooks'
import { formatCurrency } from '../accounts.format'
import type { Account } from '../types/account.types'
import styles from './accounts.module.css'

export function BalanceAdjustmentDialog({
  workspaceId,
  account,
  open,
  onClose,
}: {
  workspaceId: string
  account: Account | null
  open: boolean
  onClose: () => void
}) {
  const adjust = useAdjustBalance(workspaceId)
  const [actualBalance, setActualBalance] = useState(
    account?.currentBalance ?? '',
  )

  if (!account) return null
  const difference =
    actualBalance === ''
      ? null
      : Number(actualBalance) - Number(account.currentBalance)
  const close = () => {
    if (adjust.isPending) return
    setActualBalance(account.currentBalance)
    onClose()
  }

  return (
    <Dialog
      open={open}
      title="Ajustar saldo"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" disabled={adjust.isPending} onClick={close}>
            Cancelar
          </Button>
          <Button
            loading={adjust.isPending}
            disabled={difference === null || difference === 0}
            onClick={() =>
              adjust.mutate(
                {
                  accountId: account.id,
                  actualBalance,
                  occurredAt: new Date().toISOString(),
                  description: 'Ajuste manual de saldo',
                },
                { onSuccess: onClose },
              )
            }
          >
            Registrar ajuste
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <p>
          Saldo registrado:{' '}
          <strong>{formatCurrency(account.currentBalance, account.currency)}</strong>
        </p>
        <FormField label="Saldo real actual" htmlFor="actual-balance">
          <MoneyInput
            id="actual-balance"
            autoFocus
            minorUnits
            value={actualBalance}
            onValueChange={setActualBalance}
          />
        </FormField>
        {difference !== null && (
          <p>
            Diferencia:{' '}
            <strong className={difference < 0 ? styles.expense : styles.income}>
              {difference > 0 ? '+' : ''}
              {formatCurrency(String(difference), account.currency)}
            </strong>
          </p>
        )}
        <p>
          Se registrará un ajuste para que el saldo de la cuenta coincida con el
          valor indicado.
        </p>
        {adjust.error && (
          <p className={styles.error} role="alert">
            No pudimos registrar el ajuste.
          </p>
        )}
      </div>
    </Dialog>
  )
}
