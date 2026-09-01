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

test('Préstamos carga, simula y crea un préstamo histórico sin errores', async ({ page }) => {
  const consoleErrors: string[] = []
  await login(page)
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()) })
  await page.goto('/app/lending')
  await expect(page.getByRole('heading', { name: 'Préstamos', exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Simulador' }).click()
  await page.getByRole('button', { name: 'Calcular' }).click()
  await expect(page.getByText('Total estimado')).toBeVisible()
  await page.getByRole('button', { name: 'Usar para crear' }).click()
  const personName = `Persona préstamo QA ${Date.now()}`
  await page.getByPlaceholder('Nombre').fill(personName)
  await page.getByRole('button', { name: 'Agregar persona' }).click()
  await expect(page.getByRole('combobox', { name: 'Persona', exact: true })).toHaveValue(/.+/)
  await page.getByRole('button', { name: 'Crear préstamo' }).click()
  await page.getByRole('tab', { name: 'Préstamos', exact: true }).click()
  await expect(page.getByText(personName).first()).toBeVisible()
  expect(consoleErrors).toEqual([])
})

for (const width of [320, 375, 390, 768, 1366]) {
  test(`Préstamos no desborda a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await login(page)
    await page.goto('/app/lending')
    await expect(page.getByRole('heading', { name: 'Préstamos', exact: true })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })
}
