import type { CSSProperties } from 'react'
import {
  Banknote,
  CircleDollarSign,
  HandCoins,
  Landmark,
  MoreHorizontal,
  Smartphone,
  Star,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router'
import {
  Button,
  Card,
  Dropdown,
  DropdownAction,
  IconButton,
} from '@/components/ui'
import { accountTypeLabels } from '../accounts.constants'
import { formatCurrency } from '../accounts.format'
import type { Account } from '../types/account.types'
import styles from './accounts.module.css'

const accountIcons = {
  CASH: Banknote,
  CHECKING: Landmark,
  SAVINGS: Landmark,
  E_WALLET: Smartphone,
  CREDIT_CARD: WalletCards,
  INVESTMENT: TrendingUp,
  LOAN: HandCoins,
  OTHER: CircleDollarSign,
} as const

export function AccountCard({
  account,
  canWrite,
  busy,
  onEdit,
  onAdjust,
  onFavorite,
  onArchive,
  onDelete,
  onRestore,
}: {
  account: Account
  canWrite: boolean
  busy: boolean
  onEdit: () => void
  onAdjust: () => void
  onFavorite: () => void
  onArchive: () => void
  onDelete: () => void
  onRestore: () => void
}) {
  const AccountIcon = accountIcons[account.type]
  const cardStyle = account.color
    ? ({ '--account-accent': account.color } as CSSProperties)
    : undefined
  return (
    <Card className={styles.card} style={cardStyle}>
      <div className={styles.cardHead}>
        <div className={styles.accountIdentity}>
          <span className={styles.accountIcon} aria-hidden="true">
            <AccountIcon size={21} />
          </span>
          <div>
            <h2>{account.name}</h2>
            <p>{accountTypeLabels[account.type]}</p>
          </div>
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
      <div className={styles.balanceBlock}>
        <span>Saldo actual</span>
        <strong className={styles.balance}>
          {formatCurrency(account.currentBalance, account.currency)}
        </strong>
      </div>
      <div className={styles.cardActions}>
        <Link className={styles.detailLink} to={`/app/accounts/${account.id}`}>
          Ver detalle
        </Link>
        {canWrite &&
          (account.isActive ? (
            <Dropdown
              label={`Acciones de ${account.name}`}
              trigger={<MoreHorizontal size={20} />}
            >
              <DropdownAction disabled={busy} onClick={onEdit}>
                Editar
              </DropdownAction>
              <DropdownAction disabled={busy} onClick={onAdjust}>
                Ajustar saldo
              </DropdownAction>
              <DropdownAction disabled={busy} onClick={onArchive}>
                Archivar
              </DropdownAction>
              <DropdownAction danger disabled={busy} onClick={onDelete}>
                Eliminar
              </DropdownAction>
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
