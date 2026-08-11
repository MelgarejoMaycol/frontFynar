import { useState } from 'react'
import { ArrowDown, ArrowLeftRight, ArrowUp } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Badge,
  Button,
  Card,
  Dialog,
  FormField,
  MoneyInput,
  PageHeader,
  SectionHeader,
} from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import {
  useAdjustBalance,
  useTransactions,
} from '@/features/transactions/hooks/transactions.hooks'
import { formatTransactionDate } from '@/features/transactions/transactions.format'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { accountNatureLabels, accountTypeLabels } from '../accounts.constants'
import { formatCurrency } from '../accounts.format'
import { useAccount } from '../hooks/accounts.hooks'
import styles from '../components/accounts.module.css'

export function AccountDetailPage() {
  const accountId = useParams().accountId!
  const workspace = useActiveWorkspace().activeWorkspace!
  const canWrite = usePermission('accounts.write')
  const account = useAccount(workspace.id, accountId)
  const movements = useTransactions(workspace.id, {
    accountId,
    page: 1,
    limit: 10,
  })
  const categories = useCategories(workspace.id)
  const adjust = useAdjustBalance(workspace.id)
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState(false)
  const [actualBalance, setActualBalance] = useState('')
  if (account.isPending && !account.data) return <PageLoader />
  if (account.isError)
    return (
      <ErrorState
        title="Cuenta no encontrada"
        message="No pudimos consultar esta cuenta."
        onRetry={() => void account.refetch()}
      />
    )
  const item = account.data
  const difference =
    actualBalance === ''
      ? null
      : Number(actualBalance) - Number(item.currentBalance)
  const categoryName = (id: string | null) =>
    categories.data?.find((x) => x.id === id)?.name ??
    (id ? 'Categoría no disponible' : 'Sin categoría')
  return (
    <div className={styles.detail}>
      <PageHeader
        title={item.name}
        description="Detalle de tu cuenta financiera."
        actions={<Link to="/app/accounts">Volver a cuentas</Link>}
      />
      <Card className={styles.detailHero}>
        <div>
          <h2>{item.name}</h2>
          <p>
            {accountTypeLabels[item.type]} · {item.currency}
          </p>
        </div>
        <div>
          <div className={styles.detailBalance}>
            {formatCurrency(item.currentBalance, item.currency)}
          </div>
          <small>Saldo actual</small>
        </div>
        <div className={styles.detailActions}>
          {canWrite && item.isActive && (
            <Button
              onClick={() =>
                navigate(`/app/transactions?new=1&accountId=${item.id}`)
              }
            >
              Nuevo movimiento
            </Button>
          )}
          {canWrite && item.isActive && (
            <Button
              variant="secondary"
              onClick={() => {
                setActualBalance(item.currentBalance)
                setAdjusting(true)
              }}
            >
              Ajustar saldo
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/app/accounts')}>
            Administrar cuenta
          </Button>
        </div>
      </Card>
      <Card className={styles.detailSection}>
        <SectionHeader title="Información" />
        <dl className={styles.detailGrid}>
          <div>
            <dt>Institución</dt>
            <dd>{item.institutionName ?? 'No indicada'}</dd>
          </div>
          <div>
            <dt>Saldo inicial</dt>
            <dd>{formatCurrency(item.openingBalance, item.currency)}</dd>
          </div>
          <div>
            <dt>Naturaleza</dt>
            <dd>{accountNatureLabels[item.nature]}</dd>
          </div>
          <div>
            <dt>Patrimonio</dt>
            <dd>{item.includeInNetWorth ? 'Incluida' : 'No incluida'}</dd>
          </div>
          <div>
            <dt>Favorita</dt>
            <dd>{item.isFavorite ? 'Sí' : 'No'}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>
              <Badge tone={item.isActive ? 'success' : 'neutral'}>
                {item.isActive ? 'Activa' : 'Archivada'}
              </Badge>
            </dd>
          </div>
        </dl>
      </Card>
      <Card className={styles.detailSection}>
        <SectionHeader
          title="Movimientos"
          actions={
            <Link to={`/app/transactions?accountId=${item.id}`}>
              Ver todos los movimientos
            </Link>
          }
        />
        {movements.isPending ? (
          <PageLoader />
        ) : movements.data?.items.length ? (
          <div className={styles.movementList}>
            {movements.data.items.map((movement) => {
              const income = movement.type === 'INCOME'
              const expense = movement.type === 'EXPENSE'
              const adjustmentDifference =
                movement.type === 'ADJUSTMENT'
                  ? Number(movement.metadata?.difference ?? 0)
                  : 0
              const Icon = income
                ? ArrowUp
                : expense
                  ? ArrowDown
                  : ArrowLeftRight
              return (
                <Link
                  className={styles.movement}
                  key={movement.id}
                  to={`/app/transactions?transactionId=${movement.id}`}
                >
                  <Icon
                    className={
                      income || adjustmentDifference > 0
                        ? styles.income
                        : expense || adjustmentDifference < 0
                          ? styles.expense
                          : undefined
                    }
                    aria-hidden="true"
                  />
                  <div>
                    <p>
                      {movement.description ||
                        categoryName(movement.categoryId)}
                    </p>
                    <small>
                      {categoryName(movement.categoryId)} ·{' '}
                      {formatTransactionDate(
                        movement.occurredAt,
                        workspace.timezone,
                      )}
                    </small>
                  </div>
                  <strong
                    className={
                      income
                        ? styles.income
                        : expense
                          ? styles.expense
                          : undefined
                    }
                  >
                    {income || adjustmentDifference > 0
                      ? '+'
                      : expense || adjustmentDifference < 0
                        ? '−'
                        : ''}
                    {formatCurrency(movement.amount, movement.currency)}
                  </strong>
                </Link>
              )
            })}
          </div>
        ) : (
          <p>No hay movimientos registrados en esta cuenta.</p>
        )}
      </Card>
      <Dialog
        open={adjusting}
        title="Ajustar saldo"
        onClose={() => !adjust.isPending && setAdjusting(false)}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={adjust.isPending}
              onClick={() => setAdjusting(false)}
            >
              Cancelar
            </Button>
            <Button
              loading={adjust.isPending}
              disabled={difference === null || difference === 0}
              onClick={() =>
                adjust.mutate(
                  {
                    accountId: item.id,
                    actualBalance,
                    occurredAt: new Date().toISOString(),
                    description: 'Ajuste manual de saldo',
                  },
                  { onSuccess: () => setAdjusting(false) },
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
            <strong>
              {formatCurrency(item.currentBalance, item.currency)}
            </strong>
          </p>
          <FormField label="Saldo real actual" htmlFor="actual-balance">
            <MoneyInput
              id="actual-balance"
              autoFocus
              value={actualBalance}
              onValueChange={setActualBalance}
            />
          </FormField>
          {difference !== null && (
            <p>
              Diferencia:{' '}
              <strong
                className={difference < 0 ? styles.expense : styles.income}
              >
                {difference > 0 ? '+' : ''}
                {formatCurrency(String(difference), item.currency)}
              </strong>
            </p>
          )}
          <p>
            Se registrará un ajuste para que el saldo de la cuenta coincida con
            el valor indicado.
          </p>
          {adjust.error && (
            <p className={styles.error} role="alert">
              No pudimos registrar el ajuste.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  )
}
