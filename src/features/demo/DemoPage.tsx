import { useMemo, useState } from 'react'
import {
  BarChart3,
  CreditCard,
  HandCoins,
  Landmark,
  LayoutDashboard,
  Menu,
  PiggyBank,
  ReceiptText,
  Search,
  ShieldCheck,
  Target,
  WalletCards,
  X,
} from 'lucide-react'
import {
  demoAccounts,
  demoBudgets,
  demoCommitments,
  demoExpenseCategories,
  demoGoals,
  demoInformalBalances,
  demoLoans,
  demoMonthlyFlow,
  demoSummary,
  demoTransactions,
  type DemoTransactionType,
} from './demo.data'
import styles from './demo.module.css'

type DemoSection =
  | 'overview'
  | 'transactions'
  | 'accounts'
  | 'planning'
  | 'commitments'

type TransactionFilter = 'ALL' | DemoTransactionType

const sections: Array<{
  id: DemoSection
  label: string
  icon: typeof LayoutDashboard
}> = [
  { id: 'overview', label: 'Inicio', icon: LayoutDashboard },
  { id: 'transactions', label: 'Movimientos', icon: ReceiptText },
  { id: 'accounts', label: 'Cuentas', icon: WalletCards },
  { id: 'planning', label: 'Presupuestos y metas', icon: Target },
  { id: 'commitments', label: 'Deudas y préstamos', icon: HandCoins },
]

const money = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

const shortDate = (value: string) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value + 'T12:00:00'))

const percent = (value: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0

function DemoBrand() {
  return (
    <a className={styles.demoBrand} href="/" aria-label="Fynar, volver al inicio">
      <img src="/fynar-symbol.png" alt="" />
      <span>Fynar</span>
    </a>
  )
}

function DemoBadge() {
  return (
    <span className={styles.demoBadge}>
      <ShieldCheck size={14} aria-hidden="true" />
      Demo local
    </span>
  )
}

function OverviewSection() {
  const flowMax = Math.max(
    ...demoMonthlyFlow.flatMap((item) => [item.income, item.expenses]),
  )
  const expenseMax = Math.max(
    ...demoExpenseCategories.map((item) => item.amount),
  )

  return (
    <>
      <section className={styles.heroPanel}>
        <div>
          <span className={styles.eyebrow}>Septiembre de 2026</span>
          <h1>Hola, {demoSummary.ownerName}. Así van tus finanzas.</h1>
          <p>
            Esta demo contiene información de ejemplo cargada directamente en el
            navegador. No usa una cuenta real ni modifica información del servidor.
          </p>
        </div>
        <div className={styles.heroAmount}>
          <span>Disponible para usar</span>
          <strong>{money(demoSummary.availableMoney)}</strong>
          <small>
            {money(demoSummary.reservedForGoals)} están reservados en metas.
          </small>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="Resumen financiero">
        <article className={styles.summaryCard}>
          <span>Dinero total</span>
          <strong>{money(demoSummary.totalMoney)}</strong>
          <small>En 5 cuentas y bolsillos</small>
        </article>
        <article className={styles.summaryCard}>
          <span>Ingresos del mes</span>
          <strong>{money(demoSummary.totalIncome)}</strong>
          <small>Salario, extras y cobros</small>
        </article>
        <article className={styles.summaryCard}>
          <span>Egresos del mes</span>
          <strong>{money(demoSummary.totalExpenses)}</strong>
          <small>59 % de tus ingresos</small>
        </article>
        <article className={styles.summaryCard}>
          <span>Flujo neto</span>
          <strong>+{money(demoSummary.netCashFlow)}</strong>
          <small>El período cierra positivo</small>
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Evolución</span>
              <h2>Ingresos y egresos</h2>
            </div>
            <BarChart3 size={20} aria-hidden="true" />
          </header>
          <div className={styles.monthlyChart}>
            {demoMonthlyFlow.map((item) => (
              <div className={styles.monthColumn} key={item.month}>
                <div className={styles.monthBars} aria-hidden="true">
                  <span
                    className={styles.incomeColumn}
                    style={{ height: String((item.income / flowMax) * 100) + '%' }}
                  />
                  <span
                    className={styles.expenseColumn}
                    style={{ height: String((item.expenses / flowMax) * 100) + '%' }}
                  />
                </div>
                <small>{item.month}</small>
              </div>
            ))}
          </div>
          <div className={styles.legend}>
            <span><i className={styles.incomeDot} /> Ingresos</span>
            <span><i className={styles.expenseDot} /> Egresos</span>
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Tu situación hoy</span>
              <h2>Salud financiera</h2>
            </div>
            <span className={styles.score}>{demoSummary.healthScore}/100</span>
          </header>
          <div className={styles.healthTrack} aria-hidden="true">
            <span style={{ width: String(demoSummary.healthScore) + '%' }} />
          </div>
          <div className={styles.healthItems}>
            <div>
              <strong>Flujo positivo</strong>
              <span>Estás gastando menos de lo que recibes.</span>
            </div>
            <div>
              <strong>Metas activas</strong>
              <span>Tienes tres objetivos de ahorro en progreso.</span>
            </div>
            <div>
              <strong>Próximos pagos cubiertos</strong>
              <span>Tu disponible alcanza para los compromisos conocidos.</span>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Distribución</span>
              <h2>Gastos por categoría</h2>
            </div>
          </header>
          <div className={styles.categoryBars}>
            {demoExpenseCategories.slice(0, 6).map((item) => (
              <div className={styles.categoryBarRow} key={item.name}>
                <div>
                  <span>{item.name}</span>
                  <strong>{money(item.amount)}</strong>
                </div>
                <div className={styles.horizontalTrack} aria-hidden="true">
                  <span
                    style={{ width: String((item.amount / expenseMax) * 100) + '%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Actividad reciente</span>
              <h2>Últimos movimientos</h2>
            </div>
          </header>
          <div className={styles.compactTransactions}>
            {demoTransactions.slice(0, 7).map((item) => (
              <div className={styles.compactTransaction} key={item.id}>
                <span className={styles.transactionIcon}>
                  {item.type === 'INCOME' ? '+' : item.type === 'EXPENSE' ? '−' : '↔'}
                </span>
                <div>
                  <strong>{item.description}</strong>
                  <small>{item.category} · {shortDate(item.date)}</small>
                </div>
                <b className={item.type === 'INCOME' ? styles.positive : item.type === 'EXPENSE' ? styles.negative : styles.neutral}>
                  {item.type === 'INCOME' ? '+' : item.type === 'EXPENSE' ? '−' : ''}
                  {money(item.amount)}
                </b>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  )
}

function TransactionsSection() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TransactionFilter>('ALL')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es')
    return demoTransactions.filter((item) => {
      const matchesType = filter === 'ALL' || item.type === filter
      const matchesQuery =
        !normalized ||
        [item.description, item.category, item.account]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(normalized)
      return matchesType && matchesQuery
    })
  }, [filter, query])

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Historial local</span>
          <h1>Movimientos</h1>
          <p>Busca y filtra los movimientos de ejemplo igual que en una cuenta real.</p>
        </div>
        <span className={styles.countPill}>{filtered.length} movimientos</span>
      </header>

      <div className={styles.transactionToolbar}>
        <label className={styles.searchField}>
          <Search size={17} aria-hidden="true" />
          <span className={styles.srOnly}>Buscar movimientos</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por concepto, categoría o cuenta"
          />
        </label>
        <div className={styles.filterButtons} aria-label="Filtrar movimientos">
          {([
            ['ALL', 'Todos'],
            ['INCOME', 'Ingresos'],
            ['EXPENSE', 'Gastos'],
            ['TRANSFER', 'Transferencias'],
          ] as Array<[TransactionFilter, string]>).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.transactionTableWrap}>
        <table className={styles.transactionTable}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Movimiento</th>
              <th>Categoría</th>
              <th>Cuenta</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>{shortDate(item.date)}</td>
                <td><strong>{item.description}</strong></td>
                <td>{item.category}</td>
                <td>{item.account}</td>
                <td className={item.type === 'INCOME' ? styles.positive : item.type === 'EXPENSE' ? styles.negative : styles.neutral}>
                  {item.type === 'INCOME' ? '+' : item.type === 'EXPENSE' ? '−' : ''}
                  {money(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>No hay movimientos que coincidan con la búsqueda.</div>
        ) : null}
      </div>
    </section>
  )
}

function AccountsSection() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Tu dinero</span>
          <h1>Cuentas</h1>
          <p>Una vista consolidada de saldos, disponibles y propósito de cada cuenta.</p>
        </div>
        <div className={styles.headerMetric}>
          <span>Total</span>
          <strong>{money(demoSummary.totalMoney)}</strong>
        </div>
      </header>

      <div className={styles.accountGrid}>
        {demoAccounts.map((account) => (
          <article className={styles.accountCard} key={account.id}>
            <div className={styles.accountTop}>
              <span className={styles.accountIcon}><Landmark size={19} aria-hidden="true" /></span>
              <div>
                <strong>{account.name}</strong>
                <small>{account.kind}</small>
              </div>
            </div>
            <div className={styles.accountBalance}>
              <span>Saldo actual</span>
              <strong>{money(account.balance)}</strong>
            </div>
            <div className={styles.accountMeta}>
              <span>Disponible <b>{money(account.available)}</b></span>
              <span>{account.note}</span>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Composición</span>
              <h2>Dónde está tu dinero</h2>
            </div>
          </header>
          <div className={styles.accountDistribution}>
            {demoAccounts.map((account) => (
              <div key={account.id}>
                <span>{account.name}</span>
                <div className={styles.horizontalTrack} aria-hidden="true">
                  <span style={{ width: String((account.balance / demoSummary.totalMoney) * 100) + '%' }} />
                </div>
                <strong>{Math.round((account.balance / demoSummary.totalMoney) * 100)} %</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Patrimonio</span>
              <h2>Posición financiera</h2>
            </div>
          </header>
          <dl className={styles.definitionList}>
            <div><dt>Activos líquidos</dt><dd>{money(demoSummary.totalMoney)}</dd></div>
            <div><dt>Deudas pendientes</dt><dd>{money(1820000)}</dd></div>
            <div><dt>Patrimonio neto</dt><dd>{money(demoSummary.netWorth)}</dd></div>
            <div><dt>Disponible hoy</dt><dd>{money(demoSummary.availableMoney)}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  )
}

function PlanningSection() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Planificación</span>
          <h1>Presupuestos y metas</h1>
          <p>Controla cuánto puedes gastar y separa dinero para objetivos importantes.</p>
        </div>
      </header>

      <div className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Este mes</span>
              <h2>Presupuestos</h2>
            </div>
            <PiggyBank size={20} aria-hidden="true" />
          </header>
          <div className={styles.budgetList}>
            {demoBudgets.map((budget) => {
              const used = percent(budget.spent, budget.limit)
              return (
                <div className={styles.budgetRow} key={budget.name}>
                  <div>
                    <strong>{budget.name}</strong>
                    <span>{money(budget.spent)} de {money(budget.limit)}</span>
                  </div>
                  <div className={styles.horizontalTrack} aria-hidden="true">
                    <span style={{ width: String(used) + '%' }} />
                  </div>
                  <b>{used} %</b>
                </div>
              )
            })}
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Ahorro</span>
              <h2>Metas activas</h2>
            </div>
            <Target size={20} aria-hidden="true" />
          </header>
          <div className={styles.goalList}>
            {demoGoals.map((goal) => {
              const progress = percent(goal.saved, goal.target)
              return (
                <div className={styles.goalCard} key={goal.name}>
                  <div>
                    <strong>{goal.name}</strong>
                    <span>{goal.targetDate}</span>
                  </div>
                  <b>{money(goal.saved)}</b>
                  <div className={styles.horizontalTrack} aria-hidden="true">
                    <span style={{ width: String(progress) + '%' }} />
                  </div>
                  <small>{progress} % de {money(goal.target)}</small>
                </div>
              )
            })}
          </div>
        </article>
      </div>
    </section>
  )
}

function CommitmentsSection() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <span className={styles.eyebrow}>Compromisos</span>
          <h1>Deudas, cobros y préstamos</h1>
          <p>Centraliza obligaciones formales, pagos recurrentes y dinero entre personas.</p>
        </div>
        <div className={styles.headerMetric}>
          <span>Pagos programados</span>
          <strong>{money(demoSummary.scheduledPayments)}</strong>
        </div>
      </header>

      <div className={styles.dashboardGrid}>
        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Próximos días</span>
              <h2>Compromisos conocidos</h2>
            </div>
            <CreditCard size={20} aria-hidden="true" />
          </header>
          <div className={styles.commitmentList}>
            {demoCommitments.map((item) => (
              <div className={styles.commitmentRow} key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.kind} · {item.dueDate}</span>
                </div>
                <b>{money(item.amount)}</b>
                <small>{item.status}</small>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <header className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>Entre personas</span>
              <h2>Deudas y cobros informales</h2>
            </div>
            <HandCoins size={20} aria-hidden="true" />
          </header>
          <div className={styles.informalList}>
            {demoInformalBalances.map((item) => (
              <div className={styles.informalRow} key={item.person}>
                <span className={styles.avatar}>{item.person.slice(0, 1)}</span>
                <div>
                  <strong>{item.person}</strong>
                  <small>{item.relation} · {item.due}</small>
                </div>
                <span>
                  <small>{item.direction}</small>
                  <b>{money(item.amount)}</b>
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className={styles.panel}>
        <header className={styles.panelHeader}>
          <div>
            <span className={styles.eyebrow}>Dinero prestado</span>
            <h2>Préstamos otorgados</h2>
          </div>
        </header>
        <div className={styles.loanGrid}>
          {demoLoans.map((loan) => (
            <div className={styles.loanCard} key={loan.person}>
              <span className={styles.accountIcon}><HandCoins size={19} aria-hidden="true" /></span>
              <div>
                <strong>Préstamo a {loan.person}</strong>
                <small>{loan.rate}</small>
              </div>
              <dl>
                <div><dt>Capital original</dt><dd>{money(loan.principal)}</dd></div>
                <div><dt>Pendiente</dt><dd>{money(loan.pending)}</dd></div>
                <div><dt>Próxima cuota</dt><dd>{money(loan.installment)}</dd></div>
                <div><dt>Fecha</dt><dd>{loan.nextPayment}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

export function DemoPage() {
  const [section, setSection] = useState<DemoSection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const activate = (next: DemoSection) => {
    setSection(next)
    setMobileNavOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={styles.demoShell} data-bs-theme="light">
      <aside className={mobileNavOpen ? styles.demoSidebarOpen : styles.demoSidebar}>
        <div className={styles.sidebarHead}>
          <DemoBrand />
          <button
            className={styles.closeNav}
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <DemoBadge />

        <nav className={styles.demoNav} aria-label="Secciones de la demo">
          {sections.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.id}
                className={section === item.id ? styles.demoNavActive : styles.demoNavButton}
                onClick={() => activate(item.id)}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p>
            Todos los datos son ficticios y están incluidos dentro del frontend.
          </p>
          <a href="/register">Crear mi cuenta</a>
          <a href="/login">Iniciar sesión</a>
        </div>
      </aside>

      {mobileNavOpen ? (
        <button
          className={styles.navOverlay}
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className={styles.demoContent}>
        <header className={styles.demoTopbar}>
          <button
            className={styles.openNav}
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div>
            <DemoBadge />
            <span>Datos ficticios · sin conexión al backend</span>
          </div>
          <a className={styles.exitDemo} href="/">Salir de la demo</a>
        </header>

        <main className={styles.demoMain}>
          {section === 'overview' ? <OverviewSection /> : null}
          {section === 'transactions' ? <TransactionsSection /> : null}
          {section === 'accounts' ? <AccountsSection /> : null}
          {section === 'planning' ? <PlanningSection /> : null}
          {section === 'commitments' ? <CommitmentsSection /> : null}
        </main>
      </div>
    </div>
  )
}
