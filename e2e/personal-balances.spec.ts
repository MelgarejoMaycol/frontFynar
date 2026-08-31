import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}

test('Deudas y cobros funciona en escritorio y conserva el borrador al crear persona', async ({ page }) => {
  const errors: string[] = []
  await login(page)
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/app/personal-balances')
  await expect(page.getByRole('heading', { name: 'Deudas y cobros' })).toBeVisible()
  await page.getByRole('button', { name: 'Registrar', exact: true }).first().click()
  await page.getByLabel('Monto').first().fill('25000000')
  await page.getByLabel('Concepto', { exact: true }).fill('Préstamo QA')
  await page.getByLabel('Notas').first().fill('Borrador conservado')
  await page.getByRole('button', { name: 'Agregar persona' }).click()
  const personName = `Pedro QA ${Date.now()}`
  await page.getByLabel('Nombre').last().fill(personName)
  await page.getByLabel('Parentesco o relación').last().fill('Primo')
  await page.getByRole('button', { name: 'Guardar persona' }).click()
  await expect(page.getByRole('dialog', { name: 'Agregar persona' })).not.toBeVisible()
  await expect(page.getByLabel('Monto').first()).toHaveValue('250.000,00')
  await expect(page.getByLabel('Concepto', { exact: true })).toHaveValue('Préstamo QA')
  await expect(page.getByLabel('Notas').first()).toHaveValue('Borrador conservado')
  await expect(page.getByRole('dialog', { name: 'Registrar deuda o cobro' }).locator('select').first()).toContainText(personName)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.locator('article').filter({ hasText: personName })).toBeVisible()
  expect(errors).toEqual([])
})

test('Deudas y cobros no tiene overflow en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 })
  await login(page)
  await page.goto('/app/personal-balances')
  await expect(page.getByRole('heading', { name: 'Deudas y cobros' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})
