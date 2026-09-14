import { expect, test, type Page } from '@playwright/test'

async function enterDemo(page: Page) {
  await page.goto('/demo')
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión en la demo' }),
  ).toBeVisible()
  await expect(page.getByText('Andrea Demo')).toBeVisible()
  await expect(page.getByLabel('Correo electrónico demo')).toHaveValue(
    'demo@fynar.app',
  )
  await expect(page.getByLabel('Contraseña demo')).toHaveValue(
    'fynar-demo-2026',
  )
  await page
    .getByRole('button', { name: 'Iniciar sesión en la cuenta demo' })
    .click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)
  await expect(
    page.getByRole('heading', { name: 'Inicio', exact: true }),
  ).toBeVisible()
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

test('la cuenta demo permite registrar un movimiento con los formularios reales', async ({
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
  await dialog.getByRole('textbox', { name: 'Monto' }).fill('32500000')
  await dialog.getByLabel('Descripción').fill('Ingreso creado en demo')
  await dialog
    .getByRole('button', { name: 'Registrar movimiento' })
    .click()

  await expect(dialog).toHaveCount(0)
  await expect(page.getByText('Ingreso creado en demo').first()).toBeVisible()
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
  await expect(page.getByText('Fondo de emergencia').last()).toBeVisible()

  await page.goto('/app/reports')
  await expect(
    page.getByRole('heading', { name: 'Análisis financiero', exact: true }),
  ).toBeVisible()
})

test('el acceso público lleva al login demo y la experiencia real es responsive', async ({
  page,
}) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', {
      name: 'Entiende tu dinero antes de tomar decisiones.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Explorar demo' }),
  ).toHaveAttribute('href', '/demo')

  await page.goto('/login')
  const demoLink = page.getByRole('link', {
    name: /Probar Fynar con una cuenta demo/i,
  })
  await expect(demoLink).toBeVisible()
  const box = await demoLink.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(70)

  await page.setViewportSize({ width: 320, height: 760 })
  await demoLink.click()
  await expect(
    page.getByRole('heading', { name: 'Iniciar sesión en la demo' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'Iniciar sesión en la cuenta demo' })
    .click()
  await expect(page).toHaveURL(/\/app\/dashboard$/)

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
