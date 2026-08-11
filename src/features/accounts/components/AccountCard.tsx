import { MoreHorizontal, Star } from 'lucide-react'
import { Link } from 'react-router'
import { Button, Card, Dropdown, IconButton } from '@/components/ui'
import { accountTypeLabels } from '../accounts.constants'
import { formatCurrency } from '../accounts.format'
import type { Account } from '../types/account.types'
import styles from './accounts.module.css'

export function AccountCard({
  account,
  canWrite,
  busy,
  onEdit,
  onFavorite,
  onArchive,
  onRestore,
}: {
  account: Account
  canWrite: boolean
  busy: boolean
  onEdit: () => void
  onFavorite: () => void
  onArchive: () => void
  onRestore: () => void
}) {
  return (
    <Card className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h2>{account.name}</h2>
          <p>{accountTypeLabels[account.type]}</p>
        </div>
        {canWrite && account.isActive ? (
          <IconButton
            disabled={busy}
            className={account.isFavorite ? styles.favorite : undefined}
            aria-label={
              account.isFavorite
                ? 'Quitar de favoritas'
                : 'Marcar como favorita'
            }
            title={
              account.isFavorite
                ? 'Quitar de favoritas'
                : 'Marcar como favorita'
            }
            onClick={onFavorite}
          >
            <Star
              size={19}
              fill={account.isFavorite ? 'currentColor' : 'none'}
            />
          </IconButton>
        ) : account.isFavorite ? (
          <Star
            className={styles.favorite}
            aria-label="Cuenta favorita"
            size={19}
            fill="currentColor"
          />
        ) : null}
      </div>
      {account.institutionName && (
        <p className={styles.institution}>{account.institutionName}</p>
      )}
      <dl className={styles.cardDetails}>
        <div>
          <dt>Tipo</dt>
          <dd>{accountTypeLabels[account.type]}</dd>
        </div>
        <div>
          <dt>Saldo actual</dt>
          <dd className={styles.balance}>
            {formatCurrency(account.currentBalance, account.currency)}
          </dd>
        </div>
      </dl>
      <div className={styles.cardActions}>
        <Link to={`/app/accounts/${account.id}`}>Ver detalle</Link>
        {canWrite &&
          (account.isActive ? (
            <Dropdown
              label={`Acciones de ${account.name}`}
              trigger={<MoreHorizontal size={20} />}
            >
              <Button variant="ghost" disabled={busy} onClick={onEdit}>
                Editar
              </Button>
              <Button variant="ghost" disabled={busy} onClick={onArchive}>
                Archivar
              </Button>
            </Dropdown>
          ) : (
            <Button variant="secondary" loading={busy} onClick={onRestore}>
              Restaurar
            </Button>
          ))}
      </div>
    </Card>
  )
}
