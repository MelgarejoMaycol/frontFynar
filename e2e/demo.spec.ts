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

test('el login siempre permanece claro aunque exista un tema oscuro guardado', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('fynar-theme', 'DARK')
    document.documentElement.dataset.bsTheme = 'dark'
  })

  await page.goto('/login')
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'light')
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
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


test('la demo puede usar el conversor de divisas sin salir de la aplicación real', async ({
  page,
}) => {
  await page.route('**/api/v1/exchange-rates/currencies', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          defaultBase: 'COP',
          currencies: [
            { code: 'COP', name: 'peso colombiano', symbol: '$', minorUnits: 2 },
            {
              code: 'USD',
              name: 'dólar estadounidense',
              symbol: '$',
              minorUnits: 2,
            },
          ],
        },
      }),
    })
  })
  await page.route('**/api/v1/exchange-rates/convert**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          from: 'COP',
          to: 'USD',
          amount: '1000000.00',
          rate: '0.00032',
          convertedAmount: '320.00',
          date: '2026-09-14',
          provider: 'frankfurter',
          fetchedAt: '2026-09-14T18:00:00.000Z',
          cacheStatus: 'LIVE',
          disclaimer:
            'Tasa de referencia. El valor final de una entidad financiera puede incluir margen, comisión o impuestos.',
        },
      }),
    })
  })

  await enterDemo(page)
  await page.getByRole('button', { name: 'Convertir divisas' }).click()

  const dialog = page.getByRole('dialog', { name: 'Conversor de divisas' })
  await expect(dialog).toBeVisible()
  const amount = dialog.getByLabel('Monto a convertir')
  await amount.fill('100000000')
  await expect(amount).toHaveValue('1.000.000,00')
  await dialog.getByRole('button', { name: 'Convertir ahora' }).click()

  await expect(dialog.getByText('US$ 320,00')).toBeVisible()
  await expect(dialog.getByText(/frankfurter/i)).toHaveCount(0)
  await expect(dialog.getByText(/proveedor/i)).toHaveCount(0)
})

test('el resumen principal mantiene cifras grandes legibles y acciones priorizadas', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await enterDemo(page)

  const actions = page.getByLabel('Acciones rápidas').getByRole('button')
  await expect(actions.nth(0)).toContainText('Nuevo movimiento')
  await expect(actions.nth(1)).toContainText('Crear cuenta')
  await expect(actions.nth(2)).toContainText('Convertir divisas')
  await expect(actions.nth(3)).toContainText('Ver análisis')
  await expect(actions.nth(4)).toContainText('Ver créditos y deudas')

  for (const label of [
    'Tienes en total',
    'Reservado en metas',
    'Flujo del período',
    'Pagos programados',
  ]) {
    const metric = page.getByText(label, { exact: true }).locator('..')
    const value = metric.locator('strong')
    await expect(value).toBeVisible()
    const whiteSpace = await value.evaluate(
      (element) => getComputedStyle(element).whiteSpace,
    )
    expect(whiteSpace).toBe('nowrap')
  }

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true)
})


test('la demo permite simular una inversión completa sin modificar saldos', async ({
  page,
}) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1')) apiRequests.push(request.url())
  })

  await enterDemo(page)
  const availableBefore = await page
    .getByText('Disponible para usar')
    .locator('..')
    .locator('strong')
    .first()
    .textContent()

  await page.goto('/app/investments')
  await expect(
    page.getByRole('heading', {
      name: 'Simula cómo podría crecer una inversión',
      exact: true,
    }),
  ).toBeVisible()

  const initial = page.getByLabel('Monto inicial de la inversión')
  await initial.fill('500000000')
  await expect(initial).toHaveValue('5.000.000,00')

  const recurring = page.getByLabel('Aporte periódico')
  await recurring.fill('30000000')
  await expect(recurring).toHaveValue('300.000,00')

  const frequency = page.getByLabel('Frecuencia de aportes')
  await expect(frequency.locator('option[value="DAILY"]')).toHaveText('Diario')
  await expect(frequency.locator('option[value="WEEKLY"]')).toHaveText('Semanal')
  await frequency.selectOption('WEEKLY')

  await page.getByRole('button', { name: 'Simular inversión' }).click()

  await expect(page.getByText('Valor estimado al final')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tres escenarios' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Comparación con tus finanzas' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Evolución año por año' }),
  ).toBeVisible()
  await expect(page.getByText('Conservador')).toBeVisible()
  await expect(page.getByText('Base', { exact: true })).toBeVisible()
  await expect(page.getByText('Optimista')).toBeVisible()
  expect(apiRequests).toEqual([])

  await page.goto('/app/dashboard')
  const availableAfter = await page
    .getByText('Disponible para usar')
    .locator('..')
    .locator('strong')
    .first()
    .textContent()
  expect(availableAfter).toBe(availableBefore)
})
