import { expect, test, type Page } from '@playwright/test'

async function enterDemo(page: Page) {
  await page.goto('/demo')
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light')
  await expect(
    page.getByRole('heading', { name: 'Inicio', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Usuario Demo').first()).toBeVisible()
}

test('la demo usa la aplicación real, no llama la API y permite crear cuentas', async ({
  page,
}) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1')) apiRequests.push(request.url())
  })

  await enterDemo(page)

  await expect(page.getByText('Bancolombia').first()).toBeVisible()
  expect(apiRequests).toEqual([])

  await page.goto('/app/accounts')
  await expect(
    page.getByRole('heading', { name: 'Cuentas', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Nequi').first()).toBeVisible()

  await page.getByRole('button', { name: 'Nueva cuenta' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Nombre').fill('Cuenta creada en demo')
  await dialog.getByLabel('Tipo').selectOption('SAVINGS')
  await dialog.getByLabel('Institución').fill('Banco Demo')
  await dialog.getByLabel('Saldo inicial').fill('75000000')
  await dialog.getByRole('button', { name: 'Crear cuenta' }).click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Cuenta creada en demo').first()).toBeVisible()
  expect(apiRequests).toEqual([])
})

test('la cuenta demo permite crear y eliminar movimientos con la interfaz real', async ({
  page,
}) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1')) apiRequests.push(request.url())
  })

  await enterDemo(page)
  await page.goto('/app/transactions')
  await expect(
    page.getByRole('heading', { name: 'Movimientos', exact: true }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Registrar movimiento' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nuevo movimiento' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('INCOME')

  const destination = dialog.getByRole('combobox', { name: 'Destino' })
  const accountValue = await destination
    .locator('optgroup[label="CUENTAS"] option')
    .first()
    .getAttribute('value')
  expect(accountValue).toBeTruthy()
  await destination.selectOption(accountValue!)

  await dialog.getByRole('button', { name: 'Categoría' }).click()
  await dialog.getByRole('listbox').getByRole('option').first().click()
  await dialog.getByRole('textbox', { name: 'Monto' }).fill('325000')
  await dialog.getByLabel('Descripción').fill('Ingreso creado en demo')
  await dialog
    .getByRole('button', { name: 'Registrar movimiento' })
    .click()

  await expect(dialog).toHaveCount(0)
  const created = page.getByText('Ingreso creado en demo').first()
  await expect(created).toBeVisible()
  await created.click()

  const detail = page.getByRole('dialog', { name: 'Detalle del movimiento' })
  await expect(detail).toBeVisible()
  await detail.getByRole('button', { name: 'Eliminar' }).click()

  const confirmation = page.getByRole('dialog', { name: 'Eliminar movimiento' })
  await expect(confirmation).toBeVisible()
  await confirmation.getByRole('button', { name: 'Eliminar' }).click()
  await expect(
    page.getByRole('status').filter({
      hasText: 'Movimiento eliminado y saldo revertido.',
    }),
  ).toBeVisible()

  expect(apiRequests).toEqual([])
})

test('la demo expone módulos reales con datos preparados', async ({ page }) => {
  await enterDemo(page)

  await page.goto('/app/categories')
  await expect(
    page.getByRole('heading', { name: 'Categorías', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Alimentación', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Salario', exact: true }),
  ).toBeVisible()

  await page.goto('/app/budgets')
  await expect(
    page.getByRole('heading', { name: 'Presupuestos', exact: true }),
  ).toBeVisible()

  await page.goto('/app/goals')
  await expect(
    page.getByRole('heading', { name: 'Metas de ahorro', exact: true }),
  ).toBeVisible()
  expect(
    await page.getByText('Fondo de emergencia', { exact: true }).count(),
  ).toBeGreaterThan(0)

  await page.goto('/app/reports')
  await expect(
    page.getByRole('heading', { name: 'Análisis financiero', exact: true }),
  ).toBeVisible()
})

test('el botón demo está visible en el login y entra directamente a la aplicación', async ({
  page,
}) => {
  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light')

  const demoButton = page.getByRole('button', { name: 'Entrar al modo demo' })
  await expect(demoButton).toBeVisible()

  const box = await demoButton.boundingBox()
  const viewport = page.viewportSize()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(56)
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    viewport?.height ?? Number.MAX_SAFE_INTEGER,
  )

  await demoButton.click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(
    page.getByRole('heading', { name: 'Inicio', exact: true }),
  ).toBeVisible()

  await page.setViewportSize({ width: 320, height: 760 })
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)

  await page.getByRole('button', { name: 'Abrir menú principal' }).click()
  await expect(page.getByRole('link', { name: 'Cuentas' })).toBeVisible()
  await page.getByRole('link', { name: 'Cuentas' }).click()
  await expect(
    page.getByRole('heading', { name: 'Cuentas', exact: true }),
  ).toBeVisible()
})

test('la configuración de la demo protege identidad, correo y seguridad', async ({
  page,
}) => {
  await enterDemo(page)
  await page.goto('/app/settings')

  await expect(
    page.getByRole('heading', { name: 'Configuración', exact: true }),
  ).toBeVisible()
  await expect(page.getByText('Cuenta demo protegida')).toBeVisible()
  await expect(
    page.locator('dd').filter({ hasText: /^Usuario Demo$/ }),
  ).toBeVisible()
  await expect(page.getByText('demo@fynar.app', { exact: true })).toBeVisible()

  await expect(
    page.getByRole('heading', { name: 'Cambiar contraseña' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Eliminar mi cuenta' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Salir del demo' }),
  ).toBeVisible()
})
