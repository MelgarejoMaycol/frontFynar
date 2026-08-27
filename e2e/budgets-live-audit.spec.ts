import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contrase/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}

test('auditoría funcional real de Presupuestos', async ({ page }) => {
  test.setTimeout(120_000)
  await login(page)

  await page.goto('/app/settings#preferences')
  const cycleStart = page.getByLabel('Inicio del ciclo financiero')
  if ((await cycleStart.inputValue()) !== '25') {
    await cycleStart.fill('25')
    await Promise.all([
      page.waitForResponse((response) => response.url().includes('/preferences')),
      page.getByRole('button', { name: 'Guardar preferencias' }).click(),
    ])
  }

  await page.goto('/app/budgets')
  await expect(page.getByLabel('Buscar')).toHaveAttribute(
    'placeholder',
    'Ej: Salidas, comida, universidad...',
  )
  await expect(page.getByLabel('Moneda').first()).toHaveAttribute(
    'placeholder',
    'Todas las monedas · Ej: COP',
  )

  await page.getByRole('button', { name: 'Crear presupuesto' }).click()
  const dialog = page.getByRole('dialog', { name: 'Crear presupuesto' })
  await expect(dialog.getByLabel('Nombre')).toHaveAttribute('placeholder', 'Ej: Salidas del mes')
  const amount = dialog.getByLabel('Monto')
  await expect(amount).toHaveAttribute('placeholder', '0,00')
  for (const [key, displayed] of [
    ['9', '0,09'],
    ['8', '0,98'],
    ['7', '9,87'],
    ['6', '98,76'],
    ['5', '987,65'],
    ['4', '9.876,54'],
    ['3', '98.765,43'],
  ] as const) {
    await amount.press(key)
    await expect(amount).toHaveValue(displayed)
  }

  const threshold = dialog.getByLabel('Avisarme al llegar al')
  await expect(threshold).toHaveValue('80')
  await expect(threshold.locator('xpath=following-sibling::span')).toHaveText('%')
  for (const valid of ['1', '50', '80', '100']) {
    await threshold.fill(valid)
    await expect(threshold).toHaveJSProperty('validity.valid', true)
  }
  for (const invalid of ['101', '-1']) {
    await threshold.fill(invalid)
    await expect(threshold).toHaveJSProperty('validity.valid', false)
  }
  await threshold.fill('')
  await threshold.pressSequentially('letters')
  await expect(threshold).toHaveValue('')
  await threshold.fill('80')

  const cycleResponsePromise = page.waitForResponse((response) => response.url().includes('/budgets/cycle-range'))
  await dialog.getByLabel('Periodo').selectOption('MY_CYCLE')
  const cycleResponse = await cycleResponsePromise
  expect(cycleResponse.status(), await cycleResponse.text()).toBe(200)
  await expect(dialog.getByText(/^25 de .+ — 24 de .+$/)).toBeVisible()
  await dialog.getByLabel('Periodo').selectOption('MONTHLY')

  await dialog.getByLabel('Nombre').fill(`Monto progresivo ${Date.now()}`)
  const progressiveRequestPromise = page.waitForRequest((request) =>
    request.url().includes('/budgets') && request.method() === 'POST',
  )
  const progressiveResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/budgets') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Crear presupuesto' }).click()
  const progressiveRequest = await progressiveRequestPromise
  expect(progressiveRequest.postDataJSON().amount).toBe('98765.43')
  expect((await progressiveResponsePromise).status()).toBe(201)

  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Crear presupuesto' }).first().click()
  const name = `Salidas auditoría ${Date.now()}`
  await dialog.getByLabel('Nombre').fill(name)
  await amount.fill('')
  await amount.pressSequentially('5600000')
  await expect(amount).toHaveValue('56.000,00')

  const categories = dialog.locator('fieldset').nth(0).getByRole('checkbox')
  if (await categories.count()) await categories.first().check()
  const accounts = dialog.locator('fieldset').nth(1).getByRole('checkbox')
  if (await accounts.count()) await accounts.first().check()

  const createRequestPromise = page.waitForRequest((request) =>
    request.url().includes('/budgets') && request.method() === 'POST',
  )
  const createResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/budgets') && response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Crear presupuesto' }).click()
  const createRequest = await createRequestPromise
  const createResponse = await createResponsePromise
  expect(createRequest.postDataJSON().amount).toBe('56000.00')
  expect(createResponse.status()).toBe(201)
  const created = (await createResponse.json()).data as { id: string }

  const card = page.getByRole('heading', { name, exact: true }).locator('xpath=ancestor::*[.//button[normalize-space()="Ver detalle"]][1]')
  await expect(card).toContainText('2026-08-01 — 2026-08-31')
  await card.getByRole('button', { name: 'Ver detalle' }).click()
  const detail = page.getByRole('dialog', { name: 'Detalle del presupuesto' })
  await expect(detail).toContainText(name)
  await expect(detail).toContainText('$ 56.000,00')
  await expect(detail).toContainText('Disponible')
  await detail.getByRole('button', { name: 'Cerrar diálogo' }).click()

  await card.getByRole('button', { name: 'Archivar' }).click()
  const archiveDialog = page.getByRole('dialog', { name: 'Archivar presupuesto' })
  await expect(archiveDialog).toContainText('Podrás consultarlo y desarchivarlo después')
  await expect(archiveDialog.getByRole('button', { name: 'Cancelar' })).toBeVisible()
  await Promise.all([
    page.waitForResponse((response) =>
      response.url().endsWith(`/budgets/${created.id}`) && response.request().method() === 'DELETE',
    ),
    archiveDialog.getByRole('button', { name: 'Archivar', exact: true }).click(),
  ])

  await page.getByText('Filtros', { exact: true }).click()
  await page.locator('select').filter({ has: page.locator('option[value="ARCHIVED"]') }).selectOption('ARCHIVED')
  const archivedCard = page.getByRole('heading', { name, exact: true }).locator('xpath=ancestor::*[.//button[normalize-space()="Desarchivar"]][1]')
  await expect(archivedCard.getByRole('button', { name: 'Desarchivar' })).toBeVisible()
  const restoreResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith(`/budgets/${created.id}/restore`) && response.request().method() === 'POST',
  )
  await archivedCard.getByRole('button', { name: 'Desarchivar' }).click()
  const restored = (await (await restoreResponsePromise).json()).data as { id: string }
  expect(restored.id).toBe(created.id)
  await page.getByLabel('Buscar').fill(`sin archivados ${created.id}`)
  await expect(page.getByRole('heading', { name: 'No tienes presupuestos archivados' })).toBeVisible()

  await page.goto('/app/dashboard')
  await expect(page.getByRole('heading', { name: 'Presupuestos' })).toBeVisible()
  await page.goto(`/app/budgets?budgetId=${created.id}`)
  await expect(page).toHaveURL(new RegExp(`/app/budgets\\?budgetId=${created.id}`))
  await expect(page.getByRole('dialog', { name: 'Detalle del presupuesto' })).toContainText(name)
})
