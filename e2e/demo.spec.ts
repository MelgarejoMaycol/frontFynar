import { expect, test } from '@playwright/test'

test('la demo pública carga localmente y permite explorar módulos', async ({ page }) => {
  const apiRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1')) apiRequests.push(request.url())
  })

  await page.goto('/demo')

  await expect(page.getByText('Demo local').first()).toBeVisible()
  await expect(page.getByText('Ingresos y egresos')).toBeVisible()
  await expect(page.getByText('Mercado semanal')).toBeVisible()
  expect(apiRequests).toEqual([])

  await page.getByRole('button', { name: 'Movimientos' }).click()
  const search = page.getByPlaceholder('Buscar por concepto, categoría o cuenta')
  await search.fill('mercado')
  await expect(page.getByText('Mercado semanal')).toBeVisible()
  await expect(page.getByText('Mercado hogar')).toBeVisible()
  await expect(page.getByText('Pago nómina')).not.toBeVisible()

  await page.getByRole('button', { name: 'Presupuestos y metas' }).click()
  await expect(page.getByText('Fondo de emergencia')).toBeVisible()
  await expect(page.getByText('Portátil nuevo')).toBeVisible()

  await page.getByRole('button', { name: 'Deudas y préstamos' }).click()
  await expect(page.getByText('Tarjeta Visa')).toBeVisible()
  await expect(page.getByText('Préstamo a Carlos')).toBeVisible()
})

test('el inicio público invita a la demo y la demo no desborda en móvil', async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Entiende tu dinero antes de tomar decisiones.' }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explorar demo' })).toHaveAttribute(
    'href',
    '/demo',
  )

  await page.setViewportSize({ width: 320, height: 760 })
  await page.goto('/demo')
  await expect(page.getByText('Demo local').first()).toBeVisible()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(overflow).toBe(false)

  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await expect(page.getByRole('button', { name: 'Cuentas' })).toBeVisible()
  await page.getByRole('button', { name: 'Cuentas' }).click()
  await expect(page.getByText('Bancolombia').first()).toBeVisible()
})
