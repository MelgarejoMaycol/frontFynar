import { expect, test } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

test('crea un crédito calculando la cuota con el backend y PostgreSQL QA reales', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contrase/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)

  await page.goto('/app/debts?tab=debts')
  await page
    .getByRole('button', { name: /nuevo crédito|registrar crédito/i })
    .first()
    .click()
  const dialog = page.getByRole('dialog', { name: 'Registrar crédito' })
  await dialog.getByLabel('Nombre').fill(`Crédito navegador QA ${Date.now()}`)
  await dialog.getByLabel('Entidad').fill('Bancolombia')
  await dialog.getByLabel('Monto original').pressSequentially('1000000000')
  await dialog
    .getByLabel(/Saldo pendiente actualmente/)
    .pressSequentially('1000000000')
  await dialog.getByLabel(/Número de cuotas restantes/).fill('24')
  await dialog.getByLabel(/Tasa de interés/).fill('1,50')
  await dialog.getByLabel('Fecha de la próxima cuota').fill('2026-09-24')

  const estimateResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/debts/estimate') &&
      response.request().method() === 'POST',
  )
  await dialog
    .getByRole('button', { name: 'Completar datos faltantes' })
    .click()
  const estimated = await estimateResponse
  expect(estimated.status()).toBe(200)
  expect(estimated.request().postDataJSON()).toMatchObject({
    originalPrincipal: '10000000.00',
    currentBalance: '10000000.00',
    interestRate: '0.015',
    remainingInstallments: 24,
    paymentFrequency: 'MONTHLY',
    firstPaymentDate: '2026-09-24',
  })
  await expect(dialog.getByText(/499\.241,02/).first()).toBeVisible()
  await expect(dialog.getByText('24/08/2028')).toBeVisible()

  const createResponse = page.waitForResponse(
    (response) =>
      /\/debts$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Confirmar y guardar' }).click()
  const created = await createResponse
  expect(created.status()).toBe(201)
  expect(created.request().postDataJSON()).toMatchObject({
    originalAmount: '10000000.00',
    currentBalance: '10000000.00',
    interestRate: '0.015',
    installmentCount: 24,
    paymentFrequency: 'MONTHLY',
  })
  await expect(dialog).not.toBeVisible()
})
