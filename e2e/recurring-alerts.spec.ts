import { expect, test } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const api = 'http://127.0.0.1:3000/api/v1'

const isoMonthsAgo = (monthsAgo: number) => {
  const now = new Date()
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 10, 12))
  return value.toISOString()
}

const tomorrowDate = () => {
  const value = new Date()
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

test('parte 5 y 6: detectar, confirmar y alertar funciona y es responsive', async ({ page, request }) => {
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

  const accountResponse = await request.post(`${api}/workspaces/${workspaceId}/accounts`, {
    headers,
    data: {
      name: `Cuenta recurrentes ${Date.now()}`,
      type: 'E_WALLET',
      nature: 'ASSET',
      currency: 'COP',
      openingBalance: '1000000.00',
    },
  })
  expect(accountResponse.status()).toBe(201)
  const accountId = (await accountResponse.json()).data.id as string

  const categoriesResponse = await request.get(`${api}/workspaces/${workspaceId}/categories`, { headers })
  expect(categoriesResponse.ok()).toBeTruthy()
  const categories = (await categoriesResponse.json()).data as Array<{ id: string; type: string }>
  const categoryId = categories.find((category) => category.type === 'EXPENSE')?.id
  expect(categoryId).toBeTruthy()

  const merchantName = `Streaming Auditoria ${Date.now()}`
  const transactionIds: string[] = []
  for (const monthsAgo of [4, 3, 2, 1]) {
    const transaction = await request.post(`${api}/workspaces/${workspaceId}/transactions/expense`, {
      headers,
      data: {
        accountId,
        categoryId,
        amount: '26900.00',
        occurredAt: isoMonthsAgo(monthsAgo),
        merchantName,
        description: 'Suscripción mensual de prueba',
      },
    })
    expect(transaction.status()).toBe(201)
    transactionIds.push((await transaction.json()).data.id as string)
  }

  const detection = await request.post(`${api}/workspaces/${workspaceId}/recurring-detection/run`, {
    headers,
    data: { months: 12 },
  })
  expect(detection.ok()).toBeTruthy()
  const detected = (await detection.json()).data.suggestions.find(
    (item: { candidate: { transactionIds: string[] } }) =>
      transactionIds.every((id) => item.candidate.transactionIds.includes(id)),
  )
  expect(detected).toBeTruthy()

  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)

  await page.getByRole('link', { name: 'Créditos y deudas' }).click()
  await expect(page).toHaveURL(/\/app\/commitments$/)
  await expect(page.getByRole('heading', { name: 'Créditos, deudas y cobros' })).toBeVisible()
  expect(pageErrors, `Errores de runtime: ${pageErrors.join(' | ')}`).toEqual([])

  const suggestions = page.getByRole('region', { name: 'Sugerencias de pagos recurrentes' })
  await expect(suggestions).toBeVisible()
  await expect(suggestions.getByText(merchantName)).toBeVisible()
  await expect(suggestions.getByText(/4 movimientos similares/i)).toBeVisible()
  await expect(suggestions.getByText(/Mensual/i).first()).toBeVisible()

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(suggestions).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }

  await suggestions.getByRole('button', { name: /Revisar/i }).click()
  const dialog = page.getByRole('dialog', { name: /Revisar pago recurrente detectado/i })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Próxima fecha').fill(tomorrowDate())
  await dialog.getByRole('button', { name: /Confirmar y crear/i }).click()
  await expect(dialog).toBeHidden()
  await expect(suggestions.getByText(merchantName)).toBeHidden()

  const bell = page.getByRole('button', { name: /^Alertas(?:\: .* sin leer)?$/i })
  await expect(bell).toBeVisible()
  await bell.click()
  const alertsDialog = page.getByRole('dialog', { name: 'Alertas' })
  await expect(alertsDialog).toBeVisible()
  await alertsDialog.getByRole('button', { name: /Actualizar/i }).click()
  await expect(alertsDialog.getByText(/Pago próximo:/i).first()).toBeVisible()
  await expect(alertsDialog.getByRole('button', { name: 'Ver centro completo' })).toBeVisible()

  await alertsDialog.getByRole('button', { name: 'Ver centro completo' }).click()
  await expect(page).toHaveURL(/\/app\/notifications$/)
  await expect(page.getByRole('heading', { name: 'Centro de alertas' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Todas' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Sin leer' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Leídas' })).toBeVisible()

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('heading', { name: 'Centro de alertas' })).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }

  expect(pageErrors, `Errores de runtime: ${pageErrors.join(' | ')}`).toEqual([])
})
