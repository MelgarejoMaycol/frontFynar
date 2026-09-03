import { useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowUp } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  SectionHeader,
} from '@/components/ui'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageLoader } from '@/components/feedback/PageLoader'
import { useCategories } from '@/features/categories/hooks/categories.hooks'
import { useTransactions } from '@/features/transactions/hooks/transactions.hooks'
import { formatTransactionDate } from '@/features/transactions/transactions.format'
import { useActiveWorkspace, usePermission } from '@/features/workspace'
import { accountNatureLabels, accountTypeLabels } from '../accounts.constants'
import { formatCurrency } from '../accounts.format'
import { BalanceAdjustmentDialog } from '../components/BalanceAdjustmentDialog'
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
  const navigate = useNavigate()
  const [adjusting, setAdjusting] = useState(false)
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
  if (item.type === 'CREDIT_CARD')
    return <Navigate to={`/app/debts/cards/${item.id}`} replace />
  const categoryName = (id: string | null) =>
    categories.data?.find((x) => x.id === id)?.name ??
    (id ? 'Categoría no disponible' : 'Sin categoría')
  const reservedForGoals = item.reservedForGoals ?? '0.00'
  const availableBalance = item.availableBalance ?? item.currentBalance
  const hasGoalReservations =
    item.nature === 'ASSET' && Number(reservedForGoals) > 0

  return (
    <div className={styles.detail}>
      <PageHeader
        title={item.name}
        description="Detalle de tu cuenta financiera."
        actions={
          <Link className={styles.backLink} to="/app/accounts">
            <ArrowLeft size={17} aria-hidden="true" /> Volver a cuentas
          </Link>
        }
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
            {formatCurrency(
              hasGoalReservations ? availableBalance : item.currentBalance,
              item.currency,
            )}
          </div>
          <small>
            {hasGoalReservations ? 'Disponible para usar' : 'Saldo actual'}
          </small>
          {hasGoalReservations && (
            <p>
              Saldo total {formatCurrency(item.currentBalance, item.currency)} · En metas{' '}
              {formatCurrency(reservedForGoals, item.currency)}
            </p>
          )}
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
              onClick={() => setAdjusting(true)}
            >
              Ajustar saldo
            </Button>
          )}
        </div>
      </Card>
      {hasGoalReservations && (
        <Card className={styles.detailSection}>
          <SectionHeader title="Distribución del dinero" />
          <dl className={styles.detailGrid}>
            <div>
              <dt>Saldo total</dt>
              <dd>{formatCurrency(item.currentBalance, item.currency)}</dd>
            </div>
            <div>
              <dt>Reservado en metas</dt>
              <dd>{formatCurrency(reservedForGoals, item.currency)}</dd>
            </div>
            <div>
              <dt>Disponible para usar</dt>
              <dd>{formatCurrency(availableBalance, item.currency)}</dd>
            </div>
          </dl>
          <p>
            El dinero reservado sigue estando físicamente en esta cuenta. Fynar lo separa del
            disponible para que no se confunda con dinero libre para gastar.
          </p>
          <Link to="/app/goals">Ver metas de ahorro</Link>
        </Card>
      )}
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
        {hasGoalReservations && (
          <p>
            Los aportes a metas no aparecen aquí porque son reservas internas: no cambian el saldo
            real ni crean un ingreso, gasto o transferencia.
          </p>
        )}
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
      <BalanceAdjustmentDialog
        workspaceId={workspace.id}
        account={item}
        open={adjusting}
        onClose={() => setAdjusting(false)}
      />
    </div>
  )
}
