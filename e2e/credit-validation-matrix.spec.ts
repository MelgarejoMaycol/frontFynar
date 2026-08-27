import { expect, test, type Locator, type Page, type APIResponse } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contrase/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}

async function openForm(page: Page) {
  await page.goto('/app/debts?tab=debts')
  await page.getByRole('button', { name: /nuevo crédito|registrar crédito/i }).first().click()
  return page.getByRole('dialog', { name: 'Registrar crédito' })
}

async function money(input: Locator, digits: string) {
  await input.pressSequentially(digits)
}

type Scenario = {
  name: string
  lender?: string
  original: string
  balance: string
  payment?: string
  installments?: string
  frequency?: 'MONTHLY' | 'WEEKLY' | 'BIMONTHLY' | 'SEMIANNUAL'
  rate?: string
  first?: string
  expectedPayment?: RegExp
  expectedEnd?: string
}

async function fill(dialog: Locator, scenario: Scenario) {
  await dialog.getByLabel('Nombre').fill(scenario.name)
  if (scenario.lender) await dialog.getByLabel('Entidad').fill(scenario.lender)
  await money(dialog.getByLabel('Monto original'), scenario.original)
  await money(dialog.getByLabel(/Saldo pendiente actualmente/), scenario.balance)
  if (scenario.payment) await money(dialog.getByLabel(/Valor esperado/), scenario.payment)
  if (scenario.installments) await dialog.getByLabel(/Número de cuotas restantes/).fill(scenario.installments)
  if (scenario.frequency) await dialog.getByLabel('Frecuencia de pago').selectOption(scenario.frequency)
  if (scenario.rate !== undefined) await dialog.getByLabel(/Tasa de interés/).fill(scenario.rate)
  if (scenario.first) await dialog.getByLabel('Fecha de la próxima cuota').fill(scenario.first)
}

async function estimate(page: Page, dialog: Locator) {
  const response = page.waitForResponse((item) => item.url().endsWith('/debts/estimate'))
  await dialog.getByRole('button', { name: 'Completar datos faltantes' }).click()
  return response
}

async function saveAndReload(page: Page, dialog: Locator, name: string): Promise<APIResponse> {
  const response = page.waitForResponse(
    (item) => /\/debts$/.test(new URL(item.url()).pathname) && item.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Confirmar y guardar' }).click()
  const created = await response
  expect(created.status()).toBe(201)
  const id = (await created.json()).data.id as string
  await expect(dialog).not.toBeVisible()
  await page.reload()
  await page.getByLabel('Buscar créditos').fill(name)
  const detailLink = page.locator(`a[href="/app/debts/${id}"]`)
  await expect(detailLink).toBeVisible()
  await detailLink.click()
  await expect(page).toHaveURL(new RegExp(`/app/debts/${id}$`))
  await expect(page.getByRole('heading', { name: 'Cronograma' })).toBeVisible()
  return created
}

test.skip('matriz funcional real A-I y persistencia', async ({ page }) => {
  test.setTimeout(900_000)
  const scenarios: Scenario[] = [
    { name: 'Crédito prueba mensual QA', lender: 'Bancolombia', original: '1000000000', balance: '1000000000', installments: '24', rate: '1,50', first: '2026-09-24', expectedPayment: /499\.241,02/, expectedEnd: '24/08/2028' },
    { name: 'Crédito cuota suministrada QA', lender: 'Bancolombia', original: '1000000000', balance: '1000000000', payment: '49924102', installments: '24', rate: '1,50', first: '2026-09-24', expectedPayment: /499\.241,02/, expectedEnd: '24/08/2028' },
    { name: 'Crédito parcialmente pagado QA', lender: 'Banco de Bogotá', original: '2300000000', balance: '1200000000', installments: '24', rate: '2,00', first: '2026-09-24', expectedPayment: /634\.453,17/, expectedEnd: '24/08/2028' },
    { name: 'Préstamo sin interés QA', lender: 'Familiar', original: '240000000', balance: '240000000', installments: '12', rate: '0', first: '2026-09-24', expectedPayment: /200\.000,00/, expectedEnd: '24/08/2027' },
    { name: 'Crédito semanal QA', original: '300000000', balance: '300000000', installments: '20', frequency: 'WEEKLY', rate: '1,20', first: '2026-09-24' },
    { name: 'Crédito bimestral QA', original: '800000000', balance: '800000000', installments: '10', frequency: 'BIMONTHLY', rate: '1,80', first: '2026-09-24' },
    { name: 'Crédito semestral QA', original: '1500000000', balance: '1500000000', installments: '6', frequency: 'SEMIANNUAL', rate: '1,00', first: '2026-09-24', expectedEnd: '24/03/2029' },
    { name: 'Estimación tasa QA', original: '500000000', balance: '500000000', payment: '44424394', installments: '12', first: '2026-09-24' },
    { name: 'Estimación cuotas QA', original: '500000000', balance: '500000000', payment: '44424394', rate: '1,00', first: '2026-09-24' },
  ]
  for (const [index, scenario] of scenarios.entries()) {
    await login(page)
    const dialog = await openForm(page)
    await fill(dialog, scenario)
    const estimated = await estimate(page, dialog)
    expect(estimated.status(), scenario.name).toBe(200)
    const body = (await estimated.json()).data
    if (scenario.expectedPayment) await expect(dialog.getByText(scenario.expectedPayment).first()).toBeVisible()
    if (scenario.expectedEnd) await expect(dialog.getByText(scenario.expectedEnd)).toBeVisible()
    if (index === 1) expect(body.paymentAmount.source).toBe('PROVIDED')
    if (index === 2) expect(body.paymentAmount.value).toBe('634453.17')
    if (index === 3) expect(body.paymentAmount.value).toBe('200000')
    if (index === 7) {
      expect(Number(body.periodicRate.value)).toBeCloseTo(0.01, 4)
      expect(body.periodicRate.source).toBe('ESTIMATED')
    }
    if (index === 8) {
      expect(body.remainingInstallments.value).toBe(12)
      expect(body.remainingInstallments.source).toBe('ESTIMATED')
    }
    const created = await saveAndReload(page, dialog, scenario.name)
    const saved = (await created.json()).data
    expect(saved.debtInstallments.length).toBe(index === 8 ? 12 : Number(scenario.installments))
  }
})

const independentScenarios: Scenario[] = [
  { name: 'Crédito prueba mensual QA', lender: 'Bancolombia', original: '1000000000', balance: '1000000000', installments: '24', rate: '1,50', first: '2026-09-24', expectedPayment: /499\.241,02/, expectedEnd: '24/08/2028' },
  { name: 'Crédito cuota suministrada QA', lender: 'Bancolombia', original: '1000000000', balance: '1000000000', payment: '49924102', installments: '24', rate: '1,50', first: '2026-09-24', expectedPayment: /499\.241,02/, expectedEnd: '24/08/2028' },
  { name: 'Crédito parcialmente pagado QA', lender: 'Banco de Bogotá', original: '2300000000', balance: '1200000000', installments: '24', rate: '2,00', first: '2026-09-24', expectedPayment: /634\.453,17/, expectedEnd: '24/08/2028' },
  { name: 'Préstamo sin interés QA', lender: 'Familiar', original: '240000000', balance: '240000000', installments: '12', rate: '0', first: '2026-09-24', expectedPayment: /200\.000,00/, expectedEnd: '24/08/2027' },
  { name: 'Crédito semanal QA', original: '300000000', balance: '300000000', installments: '20', frequency: 'WEEKLY', rate: '1,20', first: '2026-09-24' },
  { name: 'Crédito bimestral QA', original: '800000000', balance: '800000000', installments: '10', frequency: 'BIMONTHLY', rate: '1,80', first: '2026-09-24' },
  { name: 'Crédito semestral QA', original: '1500000000', balance: '1500000000', installments: '6', frequency: 'SEMIANNUAL', rate: '1,00', first: '2026-09-24', expectedEnd: '24/03/2029' },
  { name: 'Estimación tasa QA', original: '500000000', balance: '500000000', payment: '44424394', installments: '12', first: '2026-09-24' },
  { name: 'Estimación cuotas QA', original: '500000000', balance: '500000000', payment: '44424394', rate: '1,00', first: '2026-09-24' },
]

for (const [index, scenario] of independentScenarios.entries()) {
  test(`frontend real ${scenario.name}`, async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)
    const dialog = await openForm(page)
    await fill(dialog, scenario)
    const estimated = await estimate(page, dialog)
    expect(estimated.status()).toBe(200)
    const body = (await estimated.json()).data
    if (scenario.expectedPayment) await expect(dialog.getByText(scenario.expectedPayment).first()).toBeVisible()
    if (scenario.expectedEnd) await expect(dialog.getByText(scenario.expectedEnd)).toBeVisible()
    if (index === 1) expect(body.paymentAmount.source).toBe('PROVIDED')
    if (index === 2) expect(body.paymentAmount.value).toBe('634453.17')
    if (index === 3) expect(body.paymentAmount.value).toBe('200000')
    if (index === 4) expect(body.estimatedSchedule.slice(0, 3).map((x: { dueDate: string }) => x.dueDate.slice(0, 10))).toEqual(['2026-09-24','2026-10-01','2026-10-08'])
    if (index === 5) expect(body.estimatedSchedule.slice(0, 4).map((x: { dueDate: string }) => x.dueDate.slice(0, 10))).toEqual(['2026-09-24','2026-11-24','2027-01-24','2027-03-24'])
    if (index === 6) expect(body.estimatedSchedule.map((x: { dueDate: string }) => x.dueDate.slice(0, 10))).toEqual(['2026-09-24','2027-03-24','2027-09-24','2028-03-24','2028-09-24','2029-03-24'])
    if (index === 7) { expect(Number(body.periodicRate.value)).toBeCloseTo(0.01, 4); expect(body.periodicRate.source).toBe('ESTIMATED') }
    if (index === 8) { expect(body.remainingInstallments.value).toBe(12); expect(body.remainingInstallments.source).toBe('ESTIMATED') }
    const created = await saveAndReload(page, dialog, scenario.name)
    expect((await created.json()).data.debtInstallments.length).toBe(index === 8 ? 12 : Number(scenario.installments))
  })
}

test('errores, estado obsoleto y MoneyInput reales J-N', async ({ page }) => {
  test.setTimeout(300_000)
  await login(page)
  let dialog = await openForm(page)
  const amount = dialog.getByLabel('Monto original')
  for (const [digits, visible] of [['9','0,09'],['98','0,98'],['987','9,87'],['9876','98,76'],['98765','987,65'],['987654','9.876,54'],['1000000000','10.000.000,00']] as const) {
    await amount.fill('')
    await amount.pressSequentially(digits)
    await expect(amount).toHaveValue(visible)
  }
  await dialog.getByRole('button', { name: 'Cancelar' }).click()

  dialog = await openForm(page)
  await fill(dialog, { name: 'Datos insuficientes QA', original: '1000000000', balance: '1000000000' })
  let response = await estimate(page, dialog)
  expect(response.status()).toBe(200)
  await expect(dialog.getByRole('alert')).toContainText('No hay información suficiente')
  await expect(dialog.getByRole('alert')).toContainText('tasa')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()

  dialog = await openForm(page)
  await fill(dialog, { name: 'Cuota insuficiente QA', original: '1000000000', balance: '1000000000', payment: '15000000', installments: '24', rate: '2,00', first: '2026-09-24' })
  response = await estimate(page, dialog)
  expect(response.status()).toBe(200)
  await expect(dialog.getByRole('alert')).toContainText('no alcanza a cubrir los intereses')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()

  dialog = await openForm(page)
  await fill(dialog, { name: 'Estado obsoleto QA', original: '1000000000', balance: '1000000000', installments: '24', rate: '1,50', first: '2026-09-24' })
  await estimate(page, dialog)
  await expect(dialog.getByText(/499\.241,02/)).toBeVisible()
  await dialog.getByLabel(/Número de cuotas restantes/).fill('36')
  await expect(dialog.getByText(/499\.241,02/)).not.toBeVisible()
  await estimate(page, dialog)
  await expect(dialog.getByText(/361\.523,96/)).toBeVisible()
  await dialog.getByLabel(/Número de cuotas restantes/).fill('601')
  await dialog.getByRole('button', { name: 'Completar datos faltantes' }).click()
  await expect(dialog.getByText(/361\.523,96/)).not.toBeVisible()
  await expect(dialog.getByText(/entre 1 y 600/)).toBeVisible()
  await expect(dialog.getByLabel(/Número de cuotas restantes/)).toHaveValue('601')
})
