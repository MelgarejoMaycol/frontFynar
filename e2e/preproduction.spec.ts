import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
let token = ''
let workspaceId = ''
let cardId = ''
let accountId = ''
let paymentAccountId = ''
let accountName = ''
let accountBName = ''
let cardName = ''

const headers = () => ({ Authorization: `Bearer ${token}` })
const api = (path: string) => `http://127.0.0.1:3000/api/v1${path}`

async function loginUi(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\/(dashboard|debts)/)
}

async function replaceMoneyInput(page: Page, label: string, value: string) {
  const input = page.getByLabel(label)
  await input.click()
  await input.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await input.pressSequentially(value)
}

test.beforeAll(async ({ request }) => {
  const runId = Date.now().toString(36)
  const login = await request.post(api('/auth/login'), {
    data: { email, password },
  })
  expect(login.ok()).toBeTruthy()
  token = (await login.json()).data.tokens.accessToken
  const workspaces = await request.get(api('/workspaces'), {
    headers: headers(),
  })
  workspaceId = (await workspaces.json()).data[0].id
  const base = `/workspaces/${workspaceId}`
  accountName = `Cuenta E2E ${runId}`
  accountBName = `Cuenta B E2E ${runId}`
  cardName = `Tarjeta E2E ${runId}`
  const account = await request.post(api(`${base}/accounts`), {
    headers: headers(),
    data: {
      name: accountName,
      type: 'E_WALLET',
      nature: 'ASSET',
      currency: 'COP',
      openingBalance: '2000000.00',
    },
  })
  expect(account.status()).toBe(201)
  accountId = (await account.json()).data.id
  const accountB = await request.post(api(`${base}/accounts`), {
    headers: headers(),
    data: {
      name: accountBName,
      type: 'CASH',
      nature: 'ASSET',
      currency: 'COP',
      openingBalance: '350000.00',
    },
  })
  expect(accountB.status()).toBe(201)
  paymentAccountId = (await accountB.json()).data.id
  const card = await request.post(api(`${base}/cards`), {
    headers: headers(),
    data: {
      name: cardName,
      currency: 'COP',
      creditLimit: '1500000.00',
      usedCredit: '608543.22',
    },
  })
  expect(card.status()).toBe(201)
  cardId = (await card.json()).data.id
  const expectation = await request.post(
    api(`${base}/cards/${cardId}/next-payment`),
    {
      headers: headers(),
      data: { amount: '56000.00', dueDate: '2026-09-10' },
    },
  )
  expect(expectation.status()).toBe(201)
})

test('Cuentas separa tarjetas y protege saldo, favoritos y responsive', async ({
  page,
  request,
}) => {
  await loginUi(page)
  await page.goto('/app/accounts')
  await expect(
    page.getByRole('heading', { name: 'Cuentas', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: accountName })).toBeVisible()
  await expect(page.getByRole('heading', { name: accountBName })).toBeVisible()
  await expect(page.getByText(cardName, { exact: true })).not.toBeVisible()

  const cardHead = page
    .getByRole('heading', { name: accountName })
    .locator('..')
    .locator('..')
  await cardHead.getByRole('button', { name: 'Marcar como favorita' }).click()
  const favoriteFilters = page.getByRole('group', { name: 'Favoritas' })
  await favoriteFilters.getByRole('button', { name: 'Solo favoritas' }).click()
  await expect(page.getByRole('heading', { name: accountName })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: accountBName }),
  ).not.toBeVisible()
  await cardHead.getByRole('button', { name: 'Quitar de favoritas' }).click()
  await expect(
    page.getByRole('heading', { name: accountName }),
  ).not.toBeVisible()
  await favoriteFilters.getByRole('button', { name: 'Todas' }).click()
  await expect(page.getByRole('heading', { name: accountName })).toBeVisible()
  await expect(page.getByRole('heading', { name: accountBName })).toBeVisible()

  await page.setViewportSize({ width: 1366, height: 768 })
  const accountCard = page
    .getByRole('heading', { name: accountName })
    .locator('../../..')
  expect((await accountCard.boundingBox())!.width).toBeLessThanOrEqual(360)
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
  expect((await accountCard.boundingBox())!.width).toBeLessThanOrEqual(390)
  await page.setViewportSize({ width: 1366, height: 768 })

  const newButton = page.getByRole('button', { name: 'Nueva cuenta' }).first()
  await newButton.click()
  const dialog = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole('option', { name: 'Tarjeta de crédito' }),
  ).toHaveCount(0)
  await expect(dialog.getByLabel('Nombre')).toHaveAttribute(
    'placeholder',
    'Ej: Efectivo personal',
  )
  await dialog.getByLabel('Tipo').selectOption('E_WALLET')
  await expect(dialog.getByLabel('Nombre')).toHaveAttribute(
    'placeholder',
    'Ej: Nequi',
  )
  const opening = dialog.getByLabel('Saldo inicial')
  await opening.fill('')
  await opening.pressSequentially('9876543')
  await expect(opening).toHaveValue('98.765,43')
  for (const size of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size)
    const bounds = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return {
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        bodyLocked: document.body.style.overflow,
      }
    })
    expect(bounds.top).toBeGreaterThanOrEqual(0)
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.bottom).toBeLessThanOrEqual(size.height)
    expect(bounds.right).toBeLessThanOrEqual(size.width)
    expect(bounds.bodyLocked).toBe('hidden')
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(newButton).toBeFocused()

  await page.getByLabel(`Acciones de ${accountName}`).click()
  await page.getByRole('button', { name: 'Editar' }).click()
  const editDialog = page.getByRole('dialog', { name: 'Editar cuenta' })
  await expect(editDialog).toBeVisible()
  await expect(editDialog.getByLabel('Saldo inicial')).toHaveCount(0)
  await editDialog.getByRole('button', { name: 'Cancelar' }).click()

  await page.getByLabel(`Acciones de ${accountName}`).click()
  await page.getByRole('button', { name: 'Ajustar saldo' }).click()
  const adjustmentDialog = page.getByRole('dialog', { name: 'Ajustar saldo' })
  const actualBalance = adjustmentDialog.getByLabel('Saldo real actual')
  await actualBalance.fill('')
  await actualBalance.pressSequentially('9876543')
  await expect(actualBalance).toHaveValue('98.765,43')
  await expect(adjustmentDialog.getByText(/1\.901\.234,57/)).toBeVisible()
  const adjustmentRequest = page.waitForRequest((candidate) =>
    candidate.url().endsWith('/transactions/adjustment'),
  )
  await adjustmentDialog
    .getByRole('button', { name: 'Registrar ajuste' })
    .click()
  expect((await adjustmentRequest).postDataJSON()).toMatchObject({
    actualBalance: '98765.43',
  })
  await expect(adjustmentDialog).not.toBeVisible()

  const forced = await request.patch(
    api(`/workspaces/${workspaceId}/accounts/${accountId}`),
    {
      headers: headers(),
      data: { openingBalance: '1.00' },
    },
  )
  expect(forced.status()).toBe(400)
  const stored = await request.get(
    api(`/workspaces/${workspaceId}/accounts/${accountId}`),
    { headers: headers() },
  )
  expect((await stored.json()).data).toMatchObject({
    openingBalance: '2000000.00',
    currentBalance: '98765.43',
  })

  await page.goto(`/app/accounts/${accountId}`)
  await expect(
    page.getByRole('link', { name: /Volver a cuentas/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Nuevo movimiento' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Ajustar saldo' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Administrar cuenta' }),
  ).toHaveCount(0)

  await page.goto(`/app/accounts/${cardId}`)
  await expect(page).toHaveURL(`/app/debts/cards/${cardId}`)
})

test('paga el mes y distribuye un excedente sin doble débito', async ({
  page,
  request,
}) => {
  await loginUi(page)
  await page.goto(`/app/debts/cards/${cardId}?action=pay-month`)
  const amount = page.getByLabel('Monto que deseas pagar')
  await expect(amount).toBeVisible()
  await page.getByLabel('Cuenta bancaria').selectOption(paymentAccountId)
  expect((await amount.inputValue()).replace(/\D/g, '')).toBe('5600000')
  await replaceMoneyInput(page, 'Monto que deseas pagar', '2000000')
  const partialResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/cards/${cardId}/payments`) &&
      r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Confirmar' }).click()
  const partial = await partialResponse
  expect(partial.status(), await partial.text()).toBe(201)

  await page.goto(`/app/debts/cards/${cardId}?action=pay-month`)
  await expect(amount).toBeVisible()
  await page.getByLabel('Cuenta bancaria').selectOption(paymentAccountId)
  expect((await amount.inputValue()).replace(/\D/g, '')).toBe('3600000')
  await replaceMoneyInput(page, 'Monto que deseas pagar', '15800000')
  const finalResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith(`/cards/${cardId}/payments`) &&
      r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Confirmar' }).click()
  const final = await finalResponse
  expect(final.status()).toBe(201)
  expect((await final.json()).data).toMatchObject({
    totalAmount: '158000.00',
    appliedToCurrentDue: '36000.00',
    extraPayment: '122000.00',
    remainingDue: '0.00',
  })

  const cards = await request.get(api(`/workspaces/${workspaceId}/cards`), {
    headers: headers(),
  })
  const card = (await cards.json()).data.find(
    (item: { id: string }) => item.id === cardId,
  )
  expect(card.nextPayment).toBeNull()
})

test('Dashboard responde sin desbordar y permite el ciclo financiero 25', async ({
  page,
}) => {
  await loginUi(page)
  await page.goto('/app/settings')
  const cycleInput = page.getByLabel('Inicio del ciclo financiero')
  if ((await cycleInput.inputValue()) === '25') {
    await cycleInput.fill('24')
    await page.getByRole('button', { name: 'Guardar preferencias' }).click()
    await expect(
      page.getByRole('button', { name: 'Guardar preferencias' }),
    ).toBeDisabled()
    await page.reload()
  }
  await page.getByLabel('Inicio del ciclo financiero').fill('25')
  await page.getByRole('button', { name: 'Guardar preferencias' }).click()
  await expect(
    page
      .getByText(/preferencias.*actualizadas|preferencias.*guardadas/i)
      .first(),
  ).toBeVisible()

  const upcomingResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/upcoming-payments') &&
      response.status() === 200,
  )
  const dashboardResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/dashboard') &&
      response.url().includes('MY_CYCLE'),
  )
  await page.goto('/app/dashboard')
  const upcomingResponse = await upcomingResponsePromise
  const response = await dashboardResponsePromise
  const upcoming = (await upcomingResponse.json()).data as Array<{
    resourceId: string
    amount: string
    status: string
  }>
  expect(upcoming.length).toBeGreaterThan(0)
  expect(
    upcoming.some((item) => Number(item.amount) > 0 && item.status !== 'PAID'),
  ).toBeTruthy()
  await expect(page.getByRole('heading', { name: 'Por pagar' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: /^Abrir / }).first(),
  ).toBeVisible()
  await page.getByText('Periodo', { exact: true }).first().click()
  const period = page
    .locator('label')
    .filter({ hasText: 'Periodo' })
    .locator('select')
  await expect(period).toContainText(/mi ciclo/i)
  await expect(period).toHaveValue('MY_CYCLE')
  expect(response.status()).toBe(200)
  const dates = (await response.json()).data.period
  expect(dates.dateFrom).toContain('2026-08-25')
  expect(dates.dateTo).toContain('2026-09-25')

  for (const size of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size)
    await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
    const layout = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      offenders: [...document.querySelectorAll<HTMLElement>('body *')]
        .filter(
          (element) =>
            element.getBoundingClientRect().right >
            document.documentElement.clientWidth + 1,
        )
        .reverse()
        .slice(0, 8)
        .map((element) => {
          const rect = element.getBoundingClientRect()
          return `${element.tagName}.${element.className}[${rect.left},${rect.right}/${document.documentElement.clientWidth}]`
        }),
    }))
    expect(
      layout,
      `${size.width}px: ${layout.offenders.join(', ')}`,
    ).toMatchObject({ overflow: false })
  }
})
