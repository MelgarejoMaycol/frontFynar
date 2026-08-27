import type { Card, Statement } from './types'

export function monthlyCardPayment(
  card: Card,
  statement: Statement | null,
): { amount: string | null; source: 'INFORMED' | 'ESTIMATED' | null } {
  if (statement) {
    const amount = Math.max(
      0,
      Number(statement.reportedBalance ?? statement.calculatedBalance) -
        Number(statement.paidAmount),
    ).toFixed(2)
    return {
      amount,
      source: statement.reportedBalance ? 'INFORMED' : 'ESTIMATED',
    }
  }
  return {
    amount: card.nextPayment?.amount ?? null,
    source: card.nextPayment?.source ?? null,
  }
}
