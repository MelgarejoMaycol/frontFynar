import type {
  InstallmentStatus,
  LendingStatus,
  LoanInstallment,
  LoanListItem,
} from './types'

export const lendingStatusLabel: Record<LendingStatus, string> = {
  ACTIVE: 'Activo',
  OVERDUE: 'Vencido',
  PAID: 'Pagado',
  ARCHIVED: 'Archivado',
}

export const installmentStatusLabel: Record<InstallmentStatus, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  OVERDUE: 'Vencido',
  PAID: 'Pagado',
}

export const getLoanInterestPending = (loan: LoanListItem) =>
  Math.max(0, Number(loan.expectedInterest) - Number(loan.interestReceived))

export const getLoanTotalPending = (loan: LoanListItem) =>
  Math.max(0, Number(loan.currentPrincipal) + getLoanInterestPending(loan))

export const getInstallmentPending = (installment: LoanInstallment) =>
  Math.max(0, Number(installment.totalAmount) - Number(installment.totalPaid))

export const getInstallmentPrincipalPending = (installment: LoanInstallment) =>
  Math.max(
    0,
    Number(installment.principalAmount) - Number(installment.principalPaid),
  )

export const getInstallmentInterestPending = (installment: LoanInstallment) =>
  Math.max(
    0,
    Number(installment.interestAmount) - Number(installment.interestPaid),
  )
