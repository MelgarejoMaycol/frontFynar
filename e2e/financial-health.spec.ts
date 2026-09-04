import { expect, test } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const api = 'http://127.0.0.1:3000/api/v1'

const daysAgo = (days: number) => {
  const value = new Date()
  value.setUTCDate(value.getUTCDate() - days)
  value.setUTCHours(12, 0, 0, 0)
  return value.toISOString()
}

test('parte 7: salud financiera es explicable, reproducible y responsive', async ({
  page,
  request,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  const loginResponse = await request.post(`${api}/auth/login`, {
    data: { email, password },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const token = (await loginResponse.json()).data.tokens.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }

  const workspacesResponse = await request.get(`${api}/workspaces`, { headers })
  expect(workspacesResponse.ok()).toBeTruthy()
  const workspaceId = (await workspacesResponse.json()).data[0].id as string

  const accountResponse = await request.post(
    `${api}/workspaces/${workspaceId}/accounts`,
    {
      headers,
      data: {
        name: `Cuenta salud ${Date.now()}`,
        type: 'CHECKING',
        nature: 'ASSET',
        currency: 'COP',
        openingBalance: '6000000.00',
      },
    },
  )
  expect(accountResponse.status()).toBe(201)
  const accountId = (await accountResponse.json()).data.id as string

  const categoriesResponse = await request.get(
    `${api}/workspaces/${workspaceId}/categories`,
    { headers },
  )
  expect(categoriesResponse.ok()).toBeTruthy()
  const categories = (await categoriesResponse.json()).data as Array<{
    id: string
    type: 'INCOME' | 'EXPENSE'
  }>
  const incomeCategoryId = categories.find(
    (category) => category.type === 'INCOME',
  )?.id
  const expenseCategoryId = categories.find(
    (category) => category.type === 'EXPENSE',
  )?.id
  expect(incomeCategoryId).toBeTruthy()
  expect(expenseCategoryId).toBeTruthy()

  const createTransaction = async (
    type: 'income' | 'expense',
    amount: string,
    occurredAt: string,
  ) => {
    const response = await request.post(
      `${api}/workspaces/${workspaceId}/transactions/${type}`,
      {
        headers,
        data: {
          accountId,
          categoryId:
            type === 'income' ? incomeCategoryId : expenseCategoryId,
          amount,
          occurredAt,
          description: `Dato salud ${type} ${Date.now()}`,
        },
      },
    )
    expect(response.status()).toBe(201)
  }

  await createTransaction('income', '3000000.00', daysAgo(60))
  await createTransaction('expense', '1000000.00', daysAgo(59))
  await createTransaction('income', '3000000.00', daysAgo(31))
  await createTransaction('expense', '1000000.00', daysAgo(30))
  await createTransaction('income', '3000000.00', daysAgo(1))
  await createTransaction('expense', '1000000.00', daysAgo(1))

  const firstHealth = await request.get(
    `${api}/workspaces/${workspaceId}/financial-health`,
    { headers },
  )
  expect(firstHealth.ok()).toBeTruthy()
  const first = (await firstHealth.json()).data as {
    version: string
    score: number | null
    coverage: number
    availableDimensions: number
    dimensions: Array<{ id: string; score: number | null }>
  }
  expect(first.version).toBe('financial-health-v1')
  expect(first.score).not.toBeNull()
  expect(first.availableDimensions).toBeGreaterThanOrEqual(3)
  expect(first.coverage).toBeGreaterThanOrEqual(60)
  expect(first.dimensions.map((dimension) => dimension.id)).toEqual([
    'LIQUIDITY',
    'DEBT',
    'SPENDING_CONTROL',
    'SAVINGS',
    'PAYMENT_COMPLIANCE',
  ])

  const secondHealth = await request.get(
    `${api}/workspaces/${workspaceId}/financial-health`,
    { headers },
  )
  expect(secondHealth.ok()).toBeTruthy()
  const second = (await secondHealth.json()).data as typeof first
  expect(second.version).toBe(first.version)
  expect(second.score).toBe(first.score)
  expect(second.dimensions).toEqual(first.dimensions)

  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)

  const widget = page.getByRole('region', { name: 'Salud financiera' })
  await expect(widget).toBeVisible()
  await expect(widget.getByRole('heading', { name: 'Salud financiera' })).toBeVisible()
  await widget.getByRole('button', { name: /Ver detalle/i }).click()

  await expect(page).toHaveURL(/\/app\/financial-health$/)
  await expect(page.getByRole('heading', { name: 'Salud financiera' }).first()).toBeVisible()
  await expect(page.getByText('financial-health-v1')).toBeVisible()
  await expect(page.getByText('Liquidez')).toBeVisible()
  await expect(page.getByText('Endeudamiento')).toBeVisible()
  await expect(page.getByText('Control del gasto')).toBeVisible()
  await expect(page.getByText('Ahorro')).toBeVisible()
  await expect(page.getByText('Cumplimiento de pagos')).toBeVisible()
  await expect(page.getByText(/No es un score crediticio/i)).toBeVisible()

  await page.getByText('Ver cómo se calculó').first().click()
  await expect(page.getByText('Liquidez disponible')).toBeVisible()
  await expect(page.getByText('Meses de cobertura')).toBeVisible()

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
    { width: 320, height: 700 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('heading', { name: 'Salud financiera' }).first()).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }

  expect(pageErrors, `Errores de runtime: ${pageErrors.join(' | ')}`).toEqual([])
})
