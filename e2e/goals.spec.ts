import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const api = 'http://127.0.0.1:3000/api/v1'

async function prepareAccount(request: APIRequestContext) {
  const loginResponse = await request.post(`${api}/auth/login`, {
    data: { email, password },
  })
  expect(loginResponse.ok()).toBeTruthy()
  const token = (await loginResponse.json()).data.tokens.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }
  const workspacesResponse = await request.get(`${api}/workspaces`, { headers })
  expect(workspacesResponse.ok()).toBeTruthy()
  const workspaceId = (await workspacesResponse.json()).data[0].id as string
  const stamp = Date.now()
  const accountResponse = await request.post(
    `${api}/workspaces/${workspaceId}/accounts`,
    {
      headers,
      data: {
        name: `Ahorro metas CI ${stamp}`,
        type: 'SAVINGS',
        nature: 'ASSET',
        currency: 'COP',
        openingBalance: '1000000.00',
      },
    },
  )
  expect(accountResponse.status()).toBe(201)
  return {
    accountId: (await accountResponse.json()).data.id as string,
    goalName: `Moto CI ${stamp}`,
  }
}

async function loginInUi(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\/(dashboard|debts)/)
}

test('usuario administra una meta de ahorro de extremo a extremo', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  const { accountId, goalName } = await prepareAccount(request)
  await loginInUi(page)

  await page.getByRole('link', { name: 'Metas de ahorro', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/goals$/)
  await expect(
    page.getByRole('heading', { name: 'Metas de ahorro', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: /nueva meta/i }).click()
  const createDialog = page.getByRole('dialog', { name: 'Crear meta de ahorro' })
  await expect(createDialog).toBeVisible()
  await createDialog.getByLabel('Nombre de la meta').fill(goalName)
  await createDialog.getByLabel('Valor objetivo').fill('250000000')
  await createDialog.getByLabel('Fecha objetivo').fill('2027-12-31')
  await createDialog.getByLabel('Cuenta asociada').selectOption(accountId)
  await createDialog.getByRole('button', { name: 'Crear meta' }).click()

  const goalLink = page.getByRole('link', { name: `Ver meta ${goalName}` })
  await expect(goalLink).toBeVisible()
  await goalLink.click()
  await expect(page).toHaveURL(/\/app\/goals\/[0-9a-f-]+$/)
  await expect(page.getByRole('heading', { name: goalName })).toBeVisible()
  await expect(page.getByText('0.00 % completado')).toBeVisible()

  await page.getByRole('button', { name: 'Aportar', exact: true }).click()
  const contributionDialog = page.getByRole('dialog', {
    name: 'Registrar aporte a la meta',
  })
  await expect(contributionDialog).toBeVisible()
  await contributionDialog.getByLabel('Monto del aporte').fill('30000000')
  await contributionDialog.getByRole('button', { name: 'Registrar aporte' }).click()
  await expect(page.getByText('12.00 % completado')).toBeVisible()
  await expect(page.getByText('Aporte', { exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: /retirar asignación/i }).click()
  const withdrawalDialog = page.getByRole('dialog', {
    name: 'Retirar asignación de la meta',
  })
  await expect(withdrawalDialog).toBeVisible()
  await withdrawalDialog.locator('#goal-contribution-amount').fill('5000000')
  await withdrawalDialog.getByRole('button', { name: 'Registrar retiro' }).click()
  await expect(page.getByText('10.00 % completado')).toBeVisible()
  await expect(
    page.getByText('Retiro o corrección', { exact: true }).first(),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Pausar', exact: true }).click()
  await expect(page.getByText('Pausada', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Aportar', exact: true }),
  ).toHaveCount(0)

  await page.getByRole('button', { name: 'Reactivar', exact: true }).click()
  await expect(page.getByText('Activa', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Inicio', exact: true }).click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  const goalsWidget = page.getByText('Metas de ahorro', { exact: true }).last()
  await expect(goalsWidget).toBeVisible()
  const dashboardGoalLink = page.getByRole('link', {
    name: `Ver meta ${goalName}`,
    exact: true,
  })
  await expect(dashboardGoalLink).toBeVisible()
  await dashboardGoalLink.click()
  await expect(page.getByRole('heading', { name: goalName })).toBeVisible()

  await page.getByRole('button', { name: 'Archivar', exact: true }).click()
  const archiveDialog = page.getByRole('dialog', {
    name: 'Archivar meta de ahorro',
  })
  await expect(archiveDialog).toBeVisible()
  await archiveDialog.getByRole('button', { name: 'Archivar meta' }).click()
  await expect(page.getByText('Archivada', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar meta', exact: true }).click()
  await expect(page.getByText('Activa', { exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.locator('a[href="/app/goals"]:visible').first().click()
  await expect(page).toHaveURL(/\/app\/goals$/)
  await expect(
    page.getByRole('heading', { name: 'Metas de ahorro', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: `Ver meta ${goalName}` }),
  ).toBeVisible()
  const fitsViewport = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  )
  expect(fitsViewport).toBeTruthy()
})
