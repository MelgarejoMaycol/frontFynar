import { expect, test } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

test('usuario autenticado puede consultar inicio y cuentas', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()

  await expect(page).toHaveURL(/\/app\/(dashboard|debts)/)
  await page.goto('/app/dashboard')
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
