import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
let token = ''
let workspaceId = ''

const headers = () => ({ Authorization: `Bearer ${token}` })
const api = (path: string) => `http://127.0.0.1:3000/api/v1${path}`

async function loginUi(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\/(dashboard|debts)/)
}

test.beforeAll(async ({ request }) => {
  const login = await request.post(api('/auth/login'), {
    data: { email, password },
  })
  expect(login.ok()).toBeTruthy()
  token = (await login.json()).data.tokens.accessToken

  const workspaces = await request.get(api('/workspaces'), {
    headers: headers(),
  })
  expect(workspaces.ok()).toBeTruthy()
  workspaceId = (await workspaces.json()).data[0].id

  const account = await request.post(
    api(`/workspaces/${workspaceId}/accounts`),
    {
      headers: headers(),
      data: {
        name: `Dashboard accionable ${Date.now().toString(36)}`,
        type: 'SAVINGS',
        nature: 'ASSET',
        currency: 'COP',
        openingBalance: '1000000.00',
      },
    },
  )
  expect(account.status()).toBe(201)
})

test('Inicio prioriza información accionable y no desborda en PC, tablet ni móvil', async ({
  page,
}) => {
  await loginUi(page)
  await page.goto('/app/dashboard')

  await expect(
    page.getByRole('heading', { name: 'Tu situación hoy' }),
  ).toBeVisible()
  await expect(page.getByText('Disponible para usar').first()).toBeVisible()
  await expect(page.getByText('Saldo total').first()).toBeVisible()
  await expect(page.getByText('En metas').first()).toBeVisible()
  await expect(page.getByText('Compromisos · 30 días').first()).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Necesita tu atención' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Actividad del período' }).first(),
  ).toBeVisible()

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 820, height: 1180 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport)
    await expect(
      page.getByRole('heading', { name: 'Tu situación hoy' }),
    ).toBeVisible()
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true)
  }
})
