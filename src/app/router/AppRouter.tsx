import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { PageLoader } from '@/components/feedback/PageLoader'
import { NotFoundPage } from '@/components/feedback/NotFoundPage'
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { InitialPrivateRedirect, WorkspaceGate } from '@/features/workspace'

const LoginPage = lazy(() =>
  import('@/features/auth/pages/AuthPages').then((module) => ({
    default: module.LoginPage,
  })),
)
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/AuthPages').then((module) => ({
    default: module.RegisterPage,
  })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/AuthPages').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/AuthPages').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const VerificationPendingPage = lazy(() =>
  import('@/features/auth/pages/VerificationPages').then((module) => ({
    default: module.VerificationPendingPage,
  })),
)
const VerifyEmailPage = lazy(() =>
  import('@/features/auth/pages/VerificationPages').then((module) => ({
    default: module.VerifyEmailPage,
  })),
)
const GoogleCallbackPage = lazy(() =>
  import('@/features/auth/pages/VerificationPages').then((module) => ({
    default: module.GoogleCallbackPage,
  })),
)
const GoogleLegalPage = lazy(() =>
  import('@/features/auth/pages/GoogleLegalPage').then((module) => ({
    default: module.GoogleLegalPage,
  })),
)
const EmailChangePage = lazy(() =>
  import('@/features/auth/pages/EmailChangePage').then((module) => ({
    default: module.EmailChangePage,
  })),
)
const TermsPage = lazy(() =>
  import('@/features/auth/pages/LegalPages').then((module) => ({
    default: module.TermsPage,
  })),
)
const PrivacyPage = lazy(() =>
  import('@/features/auth/pages/LegalPages').then((module) => ({
    default: module.PrivacyPage,
  })),
)
const SettingsPage = lazy(() =>
  import('@/features/auth/pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const DashboardPage = lazy(() =>
  import('@/features/dashboard').then((module) => ({
    default: module.DashboardPage,
  })),
)
const PurchaseSimulatorPage = lazy(() =>
  import('@/features/simulations').then((module) => ({
    default: module.PurchaseSimulatorPage,
  })),
)
const AccountsPage = lazy(() =>
  import('@/features/accounts').then((module) => ({
    default: module.AccountsPage,
  })),
)
const AccountDetailPage = lazy(() =>
  import('@/features/accounts').then((module) => ({
    default: module.AccountDetailPage,
  })),
)
const CategoriesPage = lazy(() =>
  import('@/features/categories').then((module) => ({
    default: module.CategoriesPage,
  })),
)
const TransactionsPage = lazy(() =>
  import('@/features/transactions').then((module) => ({
    default: module.TransactionsPage,
  })),
)
const BudgetsPage = lazy(() =>
  import('@/features/budgets').then((module) => ({
    default: module.BudgetsPage,
  })),
)
const GoalsPage = lazy(() =>
  import('@/features/goals').then((module) => ({
    default: module.GoalsPage,
  })),
)
const GoalDetailPage = lazy(() =>
  import('@/features/goals').then((module) => ({
    default: module.GoalDetailPage,
  })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports').then((module) => ({
    default: module.ReportsPage,
  })),
)
const CommitmentsPage = lazy(() =>
  import('@/features/commitments').then((module) => ({
    default: module.CommitmentsPage,
  })),
)
const LiabilitiesPage = lazy(() =>
  import('@/features/liabilities').then((module) => ({
    default: module.LiabilitiesPage,
  })),
)
const DebtDetailPage = lazy(() =>
  import('@/features/liabilities').then((module) => ({
    default: module.DebtDetailPage,
  })),
)
const CardDetailPage = lazy(() =>
  import('@/features/liabilities').then((module) => ({
    default: module.CardDetailPage,
  })),
)
const ObligationDetailPage = lazy(() =>
  import('@/features/liabilities').then((module) => ({
    default: module.ObligationDetailPage,
  })),
)
const PersonalBalancesPage = lazy(() =>
  import('@/features/personal-balances').then((module) => ({
    default: module.PersonalBalancesPage,
  })),
)
const LendingPage = lazy(() =>
  import('@/features/lending').then((module) => ({
    default: module.LendingPage,
  })),
)
const pending = (page: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{page}</Suspense>
)
const publicLight = (page: ReactNode) => (
  <div data-bs-theme="light">{pending(page)}</div>
)

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={pending(<LoginPage />)} />
          <Route path="/register" element={pending(<RegisterPage />)} />
          <Route
            path="/forgot-password"
            element={pending(<ForgotPasswordPage />)}
          />
          <Route
            path="/reset-password"
            element={pending(<ResetPasswordPage />)}
          />
          <Route
            path="/verify-email/pending"
            element={pending(<VerificationPendingPage />)}
          />
          <Route path="/verify-email" element={pending(<VerifyEmailPage />)} />
          <Route
            path="/auth/google/callback"
            element={pending(<GoogleCallbackPage />)}
          />
          <Route
            path="/auth/google/legal"
            element={pending(<GoogleLegalPage />)}
          />
          <Route
            path="/verify-email-change"
            element={pending(<EmailChangePage />)}
          />
        </Route>
      </Route>
      <Route path="/terms" element={publicLight(<TermsPage />)} />
      <Route path="/privacy" element={publicLight(<PrivacyPage />)} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<InitialPrivateRedirect />} />
          <Route element={<WorkspaceGate />}>
            <Route path="dashboard" element={pending(<DashboardPage />)} />
            <Route path="simulator" element={pending(<PurchaseSimulatorPage />)} />
            <Route path="accounts" element={pending(<AccountsPage />)} />
            <Route
              path="accounts/:accountId"
              element={pending(<AccountDetailPage />)}
            />
            <Route path="categories" element={pending(<CategoriesPage />)} />
            <Route
              path="transactions"
              element={pending(<TransactionsPage />)}
            />
            <Route path="budgets" element={pending(<BudgetsPage />)} />
            <Route path="goals" element={pending(<GoalsPage />)} />
            <Route
              path="goals/:goalId"
              element={pending(<GoalDetailPage />)}
            />
            <Route path="reports" element={pending(<ReportsPage />)} />
            <Route path="commitments" element={pending(<CommitmentsPage />)} />
            <Route path="debts" element={pending(<LiabilitiesPage />)} />
            <Route path="debts/:debtId" element={pending(<DebtDetailPage />)} />
            <Route
              path="debts/cards/:cardId"
              element={pending(<CardDetailPage />)}
            />
            <Route
              path="debts/obligations/:obligationId"
              element={pending(<ObligationDetailPage />)}
            />
            <Route
              path="personal-balances"
              element={pending(<PersonalBalancesPage />)}
            />
            <Route path="lending" element={pending(<LendingPage />)} />
          </Route>
          <Route path="settings" element={pending(<SettingsPage />)} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
