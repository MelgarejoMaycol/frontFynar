import fs from 'node:fs'

const detailPath = 'src/features/liabilities/DetailPages.tsx'
let detail = fs.readFileSync(detailPath, 'utf8')

const oldPeriods = `{o.occurrences.map((x) => (`
const newPeriods = `{[...o.occurrences]
              .sort((a, b) => {
                const aPending = !['PAID', 'CANCELLED'].includes(a.status)
                const bPending = !['PAID', 'CANCELLED'].includes(b.status)
                if (aPending !== bPending) return aPending ? -1 : 1
                return aPending
                  ? a.dueDate.localeCompare(b.dueDate)
                  : b.dueDate.localeCompare(a.dueDate)
              })
              .map((x) => (`
if (!detail.includes(oldPeriods)) throw new Error('No se encontró el map de periodos')
detail = detail.replace(oldPeriods, newPeriods)

const oldCard = `<Card className={styles.row} key={x.id}>`
const newCard = `<Card
                className={\`${styles.row} ${'${'}x.status === 'PAID' ? styles.paidOccurrence : ''}\`}
                key={x.id}
              >`
if (!detail.includes(oldCard)) throw new Error('No se encontró la tarjeta de periodo')
detail = detail.replace(oldCard, newCard)

const oldSelect = `      <FormField label="Cuenta pagadora" htmlFor="op-account">
        <Select id="op-account" name="accountId">
          {accounts.data
            ?.filter((a) => a.nature === 'ASSET' && a.currency === o.currency)
            .map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
        </Select>
      </FormField>`
const newSelect = `      <FormField
        label="Cuenta o tarjeta pagadora"
        htmlFor="op-account"
        helpText="Se muestra el saldo disponible de las cuentas y el cupo disponible de las tarjetas."
      >
        <Select id="op-account" name="accountId" required>
          {accounts.data
            ?.filter(
              (a) =>
                a.currency === o.currency &&
                a.isActive &&
                (a.nature === 'ASSET' || a.type === 'CREDIT_CARD'),
            )
            .map((a) => {
              const available =
                a.type === 'CREDIT_CARD'
                  ? Math.max(0, Number(a.creditLimit ?? 0) - Number(a.currentBalance))
                  : Number(a.currentBalance)
              return (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.type === 'CREDIT_CARD' ? 'Cupo' : 'Disponible'}{' '}
                  {money(available.toFixed(2), a.currency)}
                </option>
              )
            })}
        </Select>
      </FormField>`
if (!detail.includes(oldSelect)) throw new Error('No se encontró el selector de cuenta pagadora')
detail = detail.replace(oldSelect, newSelect)
fs.writeFileSync(detailPath, detail)

const cssPath = 'src/features/liabilities/liabilities.module.css'
let css = fs.readFileSync(cssPath, 'utf8')
if (!css.includes('.paidOccurrence')) {
  css += `

.paidOccurrence {
  position: relative;
  overflow: hidden;
  border-color: color-mix(in srgb, var(--color-primary) 26%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary-soft) 45%, var(--color-surface));
  box-shadow: none;
}
.paidOccurrence::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 0.25rem;
  background: var(--color-primary);
}
.paidOccurrence > div:first-child strong {
  color: var(--color-text-secondary);
}
.paidOccurrence .amount > strong {
  color: var(--color-text-secondary);
}
`
}
fs.writeFileSync(cssPath, css)
