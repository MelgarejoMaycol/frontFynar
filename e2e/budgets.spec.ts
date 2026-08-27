import { expect, test, type Page } from '@playwright/test'
const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /Contraseña/ }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}
for (const viewport of [{ name: 'desktop', width: 1366, height: 768 }, { name: 'tablet', width: 1024, height: 768 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`presupuestos y widget ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await login(page)
    await page.goto('/app/budgets')
    await page.getByRole('button', { name: 'Crear presupuesto' }).click()
    const dialog = page.getByRole('dialog', { name: 'Crear presupuesto' })
    await expect(dialog.getByPlaceholder('Ej: Salidas del mes')).toBeVisible()
    const amount = dialog.getByRole('textbox', { name: /Monto/ })
    await amount.pressSequentially('9876543')
    await expect(amount).toHaveValue('98.765,43')
    await expect(dialog.getByLabel(/Avisarme/)).toHaveValue('80')
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.goto('/app/dashboard')
    await expect(page.getByRole('heading', { name: 'Presupuestos' })).toBeVisible()
  })
}
