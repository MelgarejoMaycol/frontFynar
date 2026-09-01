import { useEffect, type ReactNode } from 'react'
import { ArrowLeft, CalendarClock, CreditCard, HandCoins, Landmark } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui'
import styles from './liabilities.module.css'
import './liabilities-redesign.css'
import './liabilities-cards.css'

function defaultHeaderIcon(title: string) {
  const normalized = title.toLowerCase()

  if (normalized.includes('tarjeta')) return <CreditCard size={26} />
  if (normalized.includes('pago') || normalized.includes('obligación'))
    return <CalendarClock size={26} />
  if (normalized.includes('crédito') || normalized.includes('préstamo'))
    return <HandCoins size={26} />

  return <Landmark size={26} />
}

function resourceKind(card: HTMLElement) {
  if (card.querySelector('a[href*="/app/debts/cards/"]')) return 'card'
  if (card.querySelector('a[href*="/app/debts/obligations/"]')) return 'obligation'
  return 'debt'
}

function resourceCardFromLink(link: HTMLAnchorElement) {
  let current = link.parentElement
  while (current && current !== document.body) {
    if (
      current instanceof HTMLElement &&
      current.querySelector(':scope > strong') &&
      current.querySelector(':scope > dl')
    )
      return current
    current = current.parentElement
  }
  return null
}

function compactFields(card: HTMLElement) {
  const entries = Array.from(card.querySelectorAll(':scope > dl > div')).map(
    (entry) => ({
      label: entry.querySelector('dt')?.textContent?.trim() ?? '',
      value: entry.querySelector('dd')?.textContent?.trim() ?? '',
    }),
  )
  const kind = resourceKind(card)

  if (kind === 'card') {
    const paymentPreview = card.querySelector<HTMLElement>(
      ':scope > [class*="_cardPaymentPreview_"]',
    )
    const paymentAmount = paymentPreview?.querySelector('strong')?.textContent?.trim()
    const paymentDate = paymentPreview
      ?.querySelector('small')
      ?.textContent?.replace(/^Vence el\s*/i, '')
      .trim()
    const available = entries.find((entry) => entry.label === 'Disponible')

    return [
      available,
      paymentAmount ? { label: 'Pago del periodo', value: paymentAmount } : undefined,
      paymentDate ? { label: 'Vencimiento', value: paymentDate } : undefined,
    ].filter((entry): entry is { label: string; value: string } => Boolean(entry))
  }

  const priorities =
    kind === 'obligation'
      ? ['Próximo vencimiento', 'Frecuencia', 'Estado del período']
      : ['Próxima cuota', 'Próximo pago', 'Tasa']

  return priorities
    .map((label) => entries.find((entry) => entry.label === label))
    .filter((entry): entry is { label: string; value: string } => Boolean(entry))
}

function setResourceOpen(card: HTMLElement, open: boolean) {
  card.dataset.expanded = String(open)
  const toggle = card.querySelector<HTMLButtonElement>(
    ':scope > [data-liability-accordion-toggle]',
  )
  if (toggle) {
    toggle.setAttribute('aria-expanded', String(open))
    const label = toggle.querySelector('[data-toggle-label]')
    if (label) label.textContent = open ? 'Ocultar detalles' : 'Ver detalles'
  }

  card
    .querySelectorAll<HTMLElement>(':scope > [data-liability-detail]')
    .forEach((detail) => {
      detail.setAttribute('aria-hidden', String(!open))
      detail.toggleAttribute('inert', !open)
    })
}

function enhanceResourceCard(card: HTMLElement) {
  if (card.dataset.liabilityAccordion === 'true') return
  const kind = resourceKind(card)
  card.dataset.liabilityAccordion = 'true'
  card.dataset.liabilityKind = kind
  card.dataset.expanded = 'false'
  card.tabIndex = 0

  const details = card.querySelector<HTMLElement>(':scope > dl')
  if (!details) return
  details.dataset.liabilityDetail = 'true'

  const paymentPreview = card.querySelector<HTMLElement>(
    ':scope > [class*="_cardPaymentPreview_"]',
  )
  if (paymentPreview) paymentPreview.dataset.liabilityDetail = 'true'

  let sibling = details.nextElementSibling
  while (sibling) {
    if (sibling instanceof HTMLElement) sibling.dataset.liabilityDetail = 'true'
    sibling = sibling.nextElementSibling
  }

  const summary = document.createElement('div')
  summary.className = 'liabilityAccordionSummary'
  summary.setAttribute('aria-label', 'Información principal')
  compactFields(card).forEach(({ label, value }) => {
    const item = document.createElement('span')
    const caption = document.createElement('small')
    const strong = document.createElement('strong')
    caption.textContent = label
    strong.textContent = value
    item.append(caption, strong)
    summary.append(item)
  })
  details.before(summary)

  const footer = document.createElement('div')
  footer.className = 'liabilityAccordionFooter'

  const hint = document.createElement('span')
  hint.className = 'liabilityAccordionHint'
  hint.textContent =
    kind === 'card'
      ? 'Cupo, fechas y acciones'
      : kind === 'obligation'
        ? 'Frecuencia, estado y acciones'
        : 'Cuota, tasa y cronograma'

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'liabilityAccordionToggle'
  toggle.dataset.liabilityAccordionToggle = 'true'
  toggle.setAttribute('aria-expanded', 'false')
  toggle.innerHTML =
    '<span data-toggle-label>Ver detalles</span><span class="liabilityAccordionChevron" aria-hidden="true"></span>'
  footer.append(hint, toggle)
  card.append(footer)

  const toggleCard = () => {
    const shouldOpen = card.dataset.expanded !== 'true'
    document
      .querySelectorAll<HTMLElement>('[data-liability-accordion="true"]')
      .forEach((other) => setResourceOpen(other, other === card && shouldOpen))
  }

  card.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (
      target.closest(
        'a, button:not([data-liability-accordion-toggle]), input, select, textarea, summary, [role="button"]',
      )
    )
      return
    toggleCard()
  })
  toggle.addEventListener('click', (event) => {
    event.stopPropagation()
    toggleCard()
  })
  card.addEventListener('keydown', (event) => {
    if (event.target !== card || !['Enter', ' '].includes(event.key)) return
    event.preventDefault()
    toggleCard()
  })

  setResourceOpen(card, false)
}

function enhanceLiabilityResources() {
  if (window.location.pathname.replace(/\/$/, '') !== '/app/debts') return

  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href^="/app/debts/"]',
  )
  const cards = new Set<HTMLElement>()
  links.forEach((link) => {
    const card = resourceCardFromLink(link)
    if (card) cards.add(card)
  })
  cards.forEach(enhanceResourceCard)
}

export function ModulePageHeader({
  title,
  subtitle,
  description,
  icon,
  actions,
}: {
  title: string
  subtitle?: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  const supportingText = subtitle ?? description
  const visualIcon = icon ?? defaultHeaderIcon(title)
  const location = useLocation()
  const navigate = useNavigate()
  const isCommitmentTool = location.pathname.replace(/\/$/, '') === '/app/debts'

  useEffect(() => {
    if (window.location.pathname.replace(/\/$/, '') !== '/app/debts') return

    const run = () => window.requestAnimationFrame(enhanceLiabilityResources)
    run()
    const observer = new MutationObserver(run)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <header className={styles.moduleHeader} data-liabilities-header>
      <div className={styles.moduleHeading}>
        <span data-liabilities-icon aria-hidden="true">
          {visualIcon}
        </span>
        <div>
          {isCommitmentTool ? (
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={() => navigate('/app/commitments')}
            >
              <ArrowLeft size={15} aria-hidden="true" /> Volver a créditos, deudas y cobros
            </Button>
          ) : null}
          <h1>{title}</h1>
          {supportingText && <p>{supportingText}</p>}
        </div>
      </div>
      {actions && <div className={styles.moduleActions}>{actions}</div>}
    </header>
  )
}
