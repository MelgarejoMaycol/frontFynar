import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const workspaceId = '03685c3a-fe16-4274-ac52-5881091cc5dd'
const obligationName = `Internet hogar QA integral ${Date.now()}`
const api = 'http://localhost:3000/api/v1'
let obligationId = ''
let paymentAccountId = ''
let apiAccessToken = ''
const archivableName = `iCloud archivo QA ${Date.now()}`
let archivableId = ''

async function loginThroughForm(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /Contraseña/ }).fill(password)
  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/auth/login') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await loginResponse
  await page.waitForURL(/\/app(?:\/|$)/)
}

async function login(page: Page) {
  await loginThroughForm(page)
}

test.beforeAll(async ({ request }) => {
  const loginResponse = await request.post(`${api}/auth/login`, {
    data: { email, password },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const accessToken = (await loginResponse.json()).data.tokens
    .accessToken as string
  apiAccessToken = accessToken
  const headers = { Authorization: `Bearer ${accessToken}` }
  const paymentAccount = await request.post(
    `${api}/workspaces/${workspaceId}/accounts`,
    {
      headers,
      data: {
        name: `Cuenta recurrentes ${Date.now()}`,
        type: 'CASH',
        nature: 'ASSET',
        currency: 'COP',
        openingBalance: '200000.00',
      },
    },
  )
  expect(paymentAccount.status()).toBe(201)
  paymentAccountId = (await paymentAccount.json()).data.id
  const list = await request.get(
    `${api}/workspaces/${workspaceId}/obligations`,
    {
      headers,
    },
  )
  expect(list.ok()).toBeTruthy()
  const current = (await list.json()).data.find(
    (item: { name: string }) => item.name === obligationName,
  )
  obligationId = (current?.id as string | undefined) ?? ''
  if (!obligationId) {
    const created = await request.post(
      `${api}/workspaces/${workspaceId}/obligations`,
      {
        headers,
        data: {
          name: obligationName,
          expectedAmount: '85000.00',
          currency: 'COP',
          amountType: 'VARIABLE',
          frequency: 'MONTHLY',
          startsOn: '2026-09-05',
        },
      },
    )
    expect(created.status()).toBe(201)
    obligationId = (await created.json()).data.id
  }
  const occurrence = await request.post(
    `${api}/workspaces/${workspaceId}/obligations/${obligationId}/occurrences`,
    {
      headers,
      data: { dueDate: '2026-09-05', amount: '85000.00' },
    },
  )
  expect(occurrence.status()).toBe(201)
  const archivable = await request.post(
    `${api}/workspaces/${workspaceId}/obligations`,
    {
      headers,
      data: {
        name: archivableName,
        expectedAmount: '12900.00',
        currency: 'COP',
        amountType: 'FIXED',
        frequency: 'MONTHLY',
        startsOn: '2026-08-05',
      },
    },
  )
  expect(archivable.status()).toBe(201)
  archivableId = (await archivable.json()).data.id
})

const viewports = [
  { name: '375 móvil', width: 375, height: 812 },
  { name: '430 móvil', width: 430, height: 932 },
  { name: 'tablet vertical', width: 768, height: 1024 },
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'desktop amplio', width: 1920, height: 1080 },
]

test('recurrentes, menús, tarjeta y calendario en todos los viewports', async ({
  page,
}) => {
  test.setTimeout(360_000)
  await login(page)
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/app/debts?tab=obligations')
    const card = page
      .locator(`[id^="obligation-"]`)
      .filter({ hasText: obligationName })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await expect(card.getByText('Mensual', { exact: true })).toBeVisible()
    await expect(card.getByText('MONTHLY', { exact: true })).toHaveCount(0)
    await expect(card.getByText('5/09/2026')).toBeVisible()
    await expect(card.getByRole('link', { name: 'Ver detalles' })).toBeVisible()
    await expect(card.getByRole('button', { name: 'Eliminar' })).toHaveCount(0)
    await card.getByLabel(`Acciones de ${obligationName}`).click()
    await expect(
      card.getByRole('link', { name: 'Registrar pago' }),
    ).toBeVisible()
    await expect(
      card.getByRole('link', { name: 'Actualizar valor' }),
    ).toBeVisible()
    await expect(card.getByRole('button', { name: 'Archivar' })).toBeVisible()

    await page.getByRole('tab', { name: 'Resumen' }).click()
    const upcoming = page.locator('#upcoming')
    await expect(upcoming.getByText(obligationName)).toBeVisible()
    await upcoming.getByRole('button', { name: /Calendario/ }).click()
    await upcoming.getByRole('button', { name: 'Mes siguiente' }).click()
    await expect(
      upcoming.getByRole('link', {
        name: new RegExp(`Pago recurrente ${obligationName}`),
      }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)

    await page.goto('/app/debts?tab=cards')
    await page.getByRole('button', { name: 'Nueva tarjeta' }).first().click()
    const cardDialog = page.getByRole('dialog', { name: 'Nueva tarjeta' })
    await expect(cardDialog.getByPlaceholder('Ej. Visa principal')).toBeVisible()
    await expect(cardDialog.getByPlaceholder('Ej. Banco de Bogotá')).toBeVisible()
    await expect(cardDialog.getByPlaceholder('Ej. 5.000.000')).toBeVisible()
    await expect(cardDialog.getByRole('checkbox', { name: /Ya pagué el período actual/ })).toBeVisible()
    expect(await cardDialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true)
    await cardDialog.getByRole('button', { name: 'Cerrar diálogo' }).click()
  }
})

test('archiva recurrente, lo excluye de activos y conserva su historial', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await login(page)
  await page.goto('/app/debts?tab=obligations')
  const card = page.locator(`#obligation-${archivableId}`)
  await expect(card).toContainText(archivableName, { timeout: 30_000 })
  await card.getByLabel(`Acciones de ${archivableName}`).click()
  await card.getByRole('button', { name: 'Archivar' }).click()
  const confirmation = page.getByRole('dialog', {
    name: 'Archivar pago recurrente',
  })
  await expect(confirmation).toContainText(
    'Esta obligación dejará de aparecer en próximos pagos, resumen y calendario futuro. Su historial se conservará.',
  )
  await confirmation.getByRole('button', { name: 'Archivar' }).click()
  await expect(card).toHaveCount(0)
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/app/debts?tab=obligations')
    await page.getByRole('button', { name: 'Archivados' }).click()
    const archivedCard = page.locator(`#obligation-${archivableId}`)
    await expect(archivedCard).toContainText(archivableName)
    await archivedCard.getByLabel(`Acciones de ${archivableName}`).click()
    await expect(archivedCard.getByRole('button', { name: 'Restaurar' })).toBeVisible()
    await expect(archivedCard.getByRole('link', { name: 'Ver historial' })).toBeVisible()
    await expect(archivedCard.getByText('Registrar pago')).toHaveCount(0)
    await expect(archivedCard.getByText('Actualizar valor')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
  await page.goto(`/app/debts/obligations/${archivableId}?action=pay`)
  await expect(page.getByRole('heading', { name: archivableName })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Registrar pago recurrente' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Pagar' })).toHaveCount(0)
  await page.goto('/app/debts?tab=obligations')
  await page.getByRole('button', { name: 'Archivados' }).click()
  const archivedCard = page.locator(`#obligation-${archivableId}`)
  await archivedCard.getByLabel(`Acciones de ${archivableName}`).click()
  const restoredResponse = page.waitForResponse(
    (response) => response.url().endsWith(`/obligations/${archivableId}/restore`) && response.request().method() === 'POST',
  )
  await archivedCard.getByRole('button', { name: 'Restaurar' }).click()
  expect((await restoredResponse).ok()).toBeTruthy()
  await page.getByRole('button', { name: 'Activos' }).click()
  await expect(page.locator(`#obligation-${archivableId}`)).toContainText(archivableName)
  const archivedResponse = await page.request.get(
    `${api}/workspaces/${workspaceId}/obligations?archived=true`,
    { headers: { Authorization: `Bearer ${apiAccessToken}` } },
  )
  expect(archivedResponse.ok()).toBeTruthy()
  expect((await archivedResponse.json()).data).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ id: archivableId })]),
  )
})

test('pagar obligación avanza período y conserva fuente unificada', async ({
  page,
}) => {
  await login(page)
  await page.goto(`/app/debts/obligations/${obligationId}?action=pay`)
  const dialog = page.getByRole('dialog', { name: 'Registrar pago recurrente' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Monto' })).toHaveValue(
    '85.000,00',
  )
  await dialog.getByLabel('Cuenta pagadora').selectOption(paymentAccountId)
  await dialog.getByRole('button', { name: 'Confirmar' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('5/10/2026')).toBeVisible()
  await page.reload()
  await expect(page.getByText('5/10/2026')).toBeVisible()
})
