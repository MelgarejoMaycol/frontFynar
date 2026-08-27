import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const debts = {
  responsive: '8556219e-cdfc-4eb8-8049-efbefcc383e6',
  reconcile: 'ae7d515f-93c7-441c-ab32-067d159e4d0c',
  prepay: 'd55375a5-52db-47bf-9f88-82098634b494',
  pay: 'c3fe0509-4a45-480f-a77c-d53f92fb866d',
}

async function login(page: Page) {
  await page.goto('/login')
  await page.waitForTimeout(500)
  if (page.url().includes('/app/')) return
  await page.getByLabel(/correo/i).fill(email)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}

async function openDebt(page: Page, id: string) {
  if (!page.url().includes('/app/')) await login(page)
  await page.getByRole('link', { name: 'Créditos y pagos', exact: true }).click()
  await page.getByRole('tab', { name: 'Créditos', exact: true }).click()
  await page.waitForTimeout(1_000)
  await page.locator(`a[href="/app/debts/${id}"]`).last().click()
  await expect(page.getByText('Saldo pendiente actualmente')).toBeVisible()
}

async function replaceWithDigits(page: Page, label: RegExp, digits: string) {
  const input = page.getByLabel(label)
  await input.click()
  await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await input.press('Backspace')
  await input.pressSequentially(digits)
  return input
}

test('detalle y formularios no desbordan en viewports reales', async ({ page }) => {
  test.setTimeout(240_000)
  await login(page)
  await page.goto(`/app/debts/${debts.responsive}`)
  await expect(page.getByText('Saldo pendiente actualmente')).toBeVisible()
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({ path: `test-results/credit-detail-${viewport.width}.png`, fullPage: true })

    for (const action of ['Conciliar', 'Registrar abono']) {
      await page.getByRole('button', { name: action, exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
      await page.screenshot({ path: `test-results/credit-${action === 'Conciliar' ? 'reconcile' : 'prepay'}-${viewport.width}.png` })
      await page.getByRole('button', { name: /cerrar diálogo/i }).click()
    }

    await page.getByRole('button', { name: /^Pagar( cuota)?$/ }).filter({ visible: true }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({ path: `test-results/credit-pay-${viewport.width}.png` })
    await page.getByRole('button', { name: /cerrar diálogo/i }).click()

    await page.goto('/app/debts?tab=debts')
    await page.getByRole('button', { name: /nuevo crédito/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({ path: `test-results/credit-new-${viewport.width}.png` })
    await page.getByRole('button', { name: /cerrar diálogo/i }).click()
    await page.getByRole('tab', { name: 'Créditos', exact: true }).click()
    await page.locator(`a[href="/app/debts/${debts.responsive}"]`).first().click()
    await expect(page.getByText('Saldo pendiente actualmente')).toBeVisible()
  }
})

test('conciliación usa entrada progresiva y persiste al recargar', async ({ page }) => {
  await login(page)
  await openDebt(page, debts.reconcile)
  await page.getByRole('button', { name: 'Conciliar', exact: true }).click()
  const input = await replaceWithDigits(page, /saldo que muestra tu entidad/i, '987654')
  await expect(input).toHaveValue('9.876,54')
  await replaceWithDigits(page, /saldo que muestra tu entidad/i, '290000000')
  await expect(input).toHaveValue('2.900.000,00')
  await page.getByLabel('Fuente').fill('App del banco QA')
  const response = page.waitForResponse((r) => r.url().includes('/reconciliations') && r.request().method() === 'POST')
  await page.getByRole('button', { name: /confirmar conciliación/i }).click()
  expect((await response).ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByText(/2\.900\.000,00/).first()).toBeVisible()
})

test('abono y pago usan entrada progresiva y afectan el detalle', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)
  await openDebt(page, debts.prepay)
  await page.getByRole('button', { name: 'Registrar abono', exact: true }).click()
  const prepay = await replaceWithDigits(page, /monto del abono/i, '65787498')
  await expect(prepay).toHaveValue('657.874,98')
  const simulation = page.waitForResponse((r) => r.url().includes('/prepayments/simulate'))
  await page.getByRole('button', { name: 'Simular' }).click()
  expect((await simulation).ok()).toBeTruthy()
  const prepayAccount = page.getByLabel('Cuenta pagadora')
  const prepayAccountCount = await prepayAccount.locator('option').count()
  await prepayAccount.selectOption({ index: prepayAccountCount - 1 })
  const applied = page.waitForResponse((r) => r.url().endsWith('/prepayments') && r.request().method() === 'POST')
  await page.getByRole('button', { name: /confirmar y aplicar abono/i }).click()
  expect((await applied).ok()).toBeTruthy()
  await page.reload()

  await login(page)
  await openDebt(page, debts.pay)
  await page.getByRole('button', { name: /^Pagar( cuota)?$/ }).filter({ visible: true }).first().click()
  const amount = page.locator('#pay-amount')
  await amount.click()
  await amount.press('Control+A')
  await amount.press('Backspace')
  await amount.pressSequentially('10000')
  await expect(amount).toHaveValue('100,00')
  await page.getByLabel('Cuenta pagadora').selectOption({ index: 1 })
  const payment = page.waitForResponse((r) => r.url().includes('/payments') && r.request().method() === 'POST')
  await page.getByRole('button', { name: /registrar pago/i }).click()
  expect((await payment).ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByText('Historial de pagos')).toBeVisible()
})
