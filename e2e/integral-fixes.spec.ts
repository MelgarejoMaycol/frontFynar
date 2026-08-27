import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app(?:\/|$)/)
}

test('cuenta conserva borrador al cerrar y lo consume después de crear', async ({
  page,
}) => {
  await login(page)
  await page.goto('/app/accounts')
  const open = page.getByRole('button', { name: 'Nueva cuenta' }).first()
  await open.click()
  let dialog = page.getByRole('dialog', { name: 'Nueva cuenta' })
  const draftName = `Nequi borrador ${Date.now()}`
  await dialog.getByLabel('Nombre').fill(draftName)
  await dialog.getByLabel('Tipo').selectOption('E_WALLET')
  await dialog.getByLabel('Saldo inicial').fill('15900000')
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await open.click()
  dialog = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(dialog.getByLabel('Nombre')).toHaveValue(draftName)
  await expect(dialog.getByLabel('Saldo inicial')).toHaveValue('159.000,00')
  const createResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/accounts') &&
      response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Crear cuenta' }).click()
  expect((await createResponse).status()).toBe(201)
  await expect(dialog).toHaveCount(0)
  await open.click()
  dialog = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(dialog.getByLabel('Nombre')).toHaveValue('')
  await expect(dialog.getByLabel('Saldo inicial')).toHaveValue('0,00')
})

test('tarjeta interpreta disponible, muestra previews y salta ciclo pagado', async ({
  page,
}) => {
  await login(page)
  await page.goto('/app/debts?tab=cards')
  await page.getByRole('button', { name: 'Nueva tarjeta' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Nueva tarjeta' })
  const cardName = `Tarjeta ciclo pagado ${Date.now()}`
  await dialog.getByLabel('Nombre de la tarjeta').fill(cardName)
  await dialog.getByLabel('Entidad o banco').fill('Bancolombia')
  await dialog.getByLabel('Cupo total').fill('150000000')
  await dialog.getByLabel('Cupo disponible actualmente').fill('65800000')
  await dialog.getByLabel('Día de corte').fill('25')
  await expect(dialog.getByText(/Próximo corte:/)).toBeVisible()
  await dialog.getByLabel('Fecha máxima de pago').fill('5')
  await expect(dialog.getByText(/Próximo pago:/)).toBeVisible()
  await dialog.getByLabel(/Ya pagué el período actual/).check()
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/cards') &&
      response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Crear tarjeta' }).click()
  const response = await responsePromise
  expect(response.status(), await response.text()).toBe(201)
  const created = (await response.json()).data
  expect(created).toMatchObject({
    creditLimit: '1500000.00',
    currentBalance: '842000.00',
  })
  await expect(page.getByRole('heading', { name: cardName })).toBeVisible()
  const card = page
    .getByRole('heading', { name: cardName })
    .locator('xpath=ancestor::div[.//progress][1]')
  await expect(card).toContainText('$ 842.000,00')
  await expect(card).toContainText('$ 658.000,00')
  await card.getByRole('link', { name: 'Ver más información' }).click()
  await expect(page.getByText('Próximo pago').first()).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: cardName })).toBeVisible()
})

test('reportes navega meses reales y dashboard prioriza nuevo movimiento', async ({
  page,
}) => {
  await login(page)
  await page.goto('/app/reports')
  await expect(page.getByText('agosto de 2026', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Mes anterior' }).click()
  await expect(page.getByText('julio de 2026', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Desde')).toHaveValue('2026-07-01')
  await expect(page.getByLabel('Hasta')).toHaveValue('2026-07-31')
  await page.getByRole('button', { name: 'Mes siguiente' }).click()
  await expect(page.getByText('agosto de 2026', { exact: true })).toBeVisible()
  await page.goto('/app/dashboard')
  const actions = page.getByLabel('Acciones rápidas').getByRole('button')
  await expect(actions.nth(0)).toContainText('Nuevo movimiento')
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
})

test('compra con tarjeta bloquea sobrecupo y persiste una compra válida', async ({
  page,
  request,
}) => {
  test.setTimeout(90_000)
  const api = 'http://127.0.0.1:3000/api/v1'
  const apiLogin = await request.post(`${api}/auth/login`, {
    data: { email, password },
  })
  expect(apiLogin.ok()).toBeTruthy()
  const token = (await apiLogin.json()).data.tokens.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }
  await login(page)
  const accountsResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/workspaces/') &&
      response.url().includes('/accounts?') &&
      response.request().method() === 'GET',
  )
  await page.goto('/app/transactions')
  const accountsUrl = (await accountsResponse).url()
  const workspaceId = accountsUrl.match(/\/workspaces\/([^/]+)\/accounts/)?.[1]
  expect(workspaceId).toBeTruthy()
  const cardName = `Tarjeta cupo QA ${Date.now()}`
  const cardResponse = await request.post(
    `${api}/workspaces/${workspaceId}/cards`,
    {
      headers,
      data: {
        name: cardName,
        currency: 'COP',
        creditLimit: '1000000.00',
        usedCredit: '800000.00',
      },
    },
  )
  expect(cardResponse.status()).toBe(201)
  const cardId = (await cardResponse.json()).data.id as string

  const refreshedCards = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/workspaces/${workspaceId}/cards`) &&
      response.request().method() === 'GET',
  )
  await page.reload()
  const cardsBody = await (await refreshedCards).json()
  expect(cardsBody.data).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: cardId })]),
  )
  await page.getByRole('button', { name: 'Registrar movimiento' }).click()
  const dialog = page.getByRole('dialog', { name: 'Registrar movimiento' })
  await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('EXPENSE')
  await dialog.getByRole('combobox', { name: 'Cuenta' }).selectOption(cardId)
  const amount = dialog.getByRole('textbox', { name: 'Monto' })
  await amount.fill('56800000')
  await expect(dialog.getByRole('alert')).toContainText(
    'No tienes cupo suficiente. Disponible: $ 200.000,00.',
  )
  await expect(
    dialog.getByRole('button', { name: 'Registrar movimiento' }),
  ).toBeDisabled()

  await amount.fill('15000000')
  await dialog.getByRole('button', { name: 'Categoría' }).click()
  await dialog.getByRole('listbox').getByRole('option').first().click()
  const createdTransaction = page.waitForResponse(
    (response) =>
      response.url().endsWith('/transactions/expense') &&
      response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Registrar movimiento' }).click()
  expect((await createdTransaction).status()).toBe(201)
  await expect(dialog).toHaveCount(0)

  const cards = await request.get(`${api}/workspaces/${workspaceId}/cards`, {
    headers,
  })
  const persisted = (await cards.json()).data.find(
    (card: { id: string }) => card.id === cardId,
  )
  expect(persisted).toMatchObject({
    currentBalance: '950000.00',
    availableCredit: '50000.00',
  })
  await page.goto('/app/debts?tab=cards')
  await expect(page.getByRole('heading', { name: cardName })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: cardName })).toBeVisible()
})
