import fs from 'node:fs'

const detailPath = 'src/features/liabilities/DetailPages.tsx'
let detail = fs.readFileSync(detailPath, 'utf8')

const oldFilter = `              (account) =>
                account.nature === 'ASSET' &&
                account.currency === obligation.currency &&
                account.isActive,`
const newFilter = `              (account) =>
                account.currency === obligation.currency &&
                account.isActive &&
                (account.nature === 'ASSET' || account.type === 'CREDIT_CARD'),`
if (!detail.includes(oldFilter)) throw new Error('No se encontró el filtro de edición')
detail = detail.replace(oldFilter, newFilter)

const oldOption = `              <option key={account.id} value={account.id}>
                {account.name} · {money(account.currentBalance, account.currency)}
              </option>`
const newOption = `              <option key={account.id} value={account.id}>
                {account.name} ·{' '}
                {account.type === 'CREDIT_CARD' ? 'Cupo' : 'Disponible'}{' '}
                {money(
                  (account.type === 'CREDIT_CARD'
                    ? Math.max(
                        0,
                        Number(account.creditLimit ?? 0) - Number(account.currentBalance),
                      )
                    : Number(account.currentBalance)
                  ).toFixed(2),
                  account.currency,
                )}
              </option>`
if (!detail.includes(oldOption)) throw new Error('No se encontró la opción de edición')
detail = detail.replace(oldOption, newOption)

const oldHint = `        {payment.account.name} recuperará {money(payment.amount, obligation.currency)} y{' '}
        {newAccount?.name ?? 'la nueva cuenta'} disminuirá{' '}
        {money(amount || '0', obligation.currency)}. La operación será atómica.`
const newHint = `        La corrección restaurará primero el efecto de {payment.account.name} y luego
        aplicará {money(amount || '0', obligation.currency)} a{' '}
        {newAccount?.name ?? 'la nueva cuenta o tarjeta'}. La operación será atómica.`
if (!detail.includes(oldHint)) throw new Error('No se encontró el texto de ayuda de edición')
detail = detail.replace(oldHint, newHint)

fs.writeFileSync(detailPath, detail)
