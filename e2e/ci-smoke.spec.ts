import { expect, test } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

test('usuario autenticado puede consultar inicio y cuentas', async ({
  page,
  request,
}) => {
  const api = 'http://127.0.0.1:3000/api/v1'
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
        name: `Cuenta CI ${Date.now()}`,
        type: 'E_WALLET',
        nature: 'ASSET',
        currency: 'COP',
        openingBalance: '150000.00',
      },
    },
  )
  expect(accountResponse.status()).toBe(201)

  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()

  await expect(page).toHaveURL(/\/app\/(dashboard|debts)/)
  await page.getByRole('link', { name: 'Inicio', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Resumen financiero' }).first(),
  ).toBeVisible()

  const accounts = page.getByRole('region', { name: 'cuentas disponibles' })
  await expect(accounts).toBeVisible()
  const accountCards = accounts.locator('a[href^="/app/accounts/"]')
  await expect(accountCards.first()).toBeVisible()
  await expect(accountCards.first().locator('svg').first()).toBeVisible()

  await page.getByRole('link', { name: 'Ver todas' }).click()
  await expect(page).toHaveURL(/\/app\/accounts$/)
  await expect(page.getByRole('heading', { name: 'Cuentas' })).toBeVisible()
})
