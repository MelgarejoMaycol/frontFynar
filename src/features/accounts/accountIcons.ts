import {
  Banknote,
  CircleDollarSign,
  HandCoins,
  Landmark,
  Smartphone,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import type { AccountType } from './types/account.types'

export const accountTypeIcons: Record<AccountType, typeof Landmark> = {
  CASH: Banknote,
  CHECKING: Landmark,
  SAVINGS: Landmark,
  E_WALLET: Smartphone,
  CREDIT_CARD: WalletCards,
  INVESTMENT: TrendingUp,
  LOAN: HandCoins,
  OTHER: CircleDollarSign,
}
