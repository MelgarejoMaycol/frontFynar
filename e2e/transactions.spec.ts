import { expect, test, type Locator, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'

async function openTransactions(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /Contraseña/ }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL(/\/app(?:\/|$)/)
  await page.goto('/app/transactions')
  await expect(
    page.getByRole('heading', { name: 'Movimientos', exact: true }),
  ).toBeVisible()
}

async function openMovementForm(page: Page) {
  await page.getByRole('button', { name: 'Registrar movimiento' }).click()
  return page.getByRole('dialog', { name: 'Registrar movimiento' })
}

async function selectFirstRealOption(
  select: Locator,
  selector = 'option:not([value=""])',
) {
  const value = await select.locator(selector).first().getAttribute('value')
  expect(value).toBeTruthy()
  await select.selectOption(value!)
}

for (const viewport of [
  { name: 'escritorio', width: 1366, height: 768 },
  { name: 'móvil', width: 390, height: 844 },
]) {
  test(`formulario y detalle accesible en ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openTransactions(page)
    const detailButtons = page.getByRole('button', { name: 'Ver detalle' })
    if (await detailButtons.count()) {
      await detailButtons.first().click()
      const detail = page.getByRole('dialog', {
        name: 'Detalle del movimiento',
      })
      await expect(detail).toBeVisible()
      await expect(
        detail.getByText(/Confirmado|Pendiente|Cancelado/),
      ).toBeVisible()
      await detail.getByRole('button', { name: /cerrar/i }).click()
    }
    await page.getByRole('button', { name: 'Registrar movimiento' }).click()
    const dialog = page.getByRole('dialog', { name: 'Registrar movimiento' })
    await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('INCOME')
    await expect(
      dialog.getByRole('option', { name: /Deuda pendiente/ }).first(),
    ).toBeAttached()
    const amount = dialog.getByRole('textbox', { name: /Monto/ })
    await amount.fill('')
    await amount.pressSequentially('9876543')
    await expect(amount).toHaveValue('98.765,43')
    await expect(
      dialog.getByPlaceholder('Ej. Pago de nómina de agosto'),
    ).toBeVisible()
    await expect(dialog.getByPlaceholder('Ej. Empresa ABC')).toBeVisible()
    await expect(
      dialog.getByPlaceholder('Ej: Compra realizada con amigos'),
    ).toBeVisible()
    await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('ADVANCE')
    await expect(
      dialog.getByRole('combobox', { name: /Tarjeta origen/ }),
    ).toBeVisible()
    await expect(
      dialog.getByRole('combobox', { name: /Cuenta destino/ }),
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
  })
  test(`crédito desaparece al cambiar contexto en ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openTransactions(page)

    let dialog = await openMovementForm(page)
    const type = dialog.getByRole('combobox', { name: /Tipo/ })
    await type.selectOption('TRANSFER')
    await selectFirstRealOption(
      dialog.getByRole('combobox', { name: /Cuenta origen/ }),
    )
    let destination = dialog.getByRole('combobox', { name: /^Destino/ })
    await selectFirstRealOption(
      destination,
      'optgroup[label="CRÉDITOS"] option',
    )
    await expect(dialog.getByText('Registrar pago del crédito')).toBeVisible()
    await dialog
      .getByRole('combobox', { name: /Aplicar como/ })
      .selectOption('EXTRA_PAYMENT')
    await expect(
      dialog.getByText('Registrar abono extraordinario'),
    ).toBeVisible()
    await type.selectOption('EXPENSE')
    await expect(
      dialog.getByText('Registrar abono extraordinario'),
    ).toHaveCount(0)
    await expect(
      dialog.getByRole('combobox', { name: /Estrategia/ }),
    ).toHaveCount(0)
    await expect(dialog.getByLabel(/Comercio o establecimiento/)).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()

    dialog = await openMovementForm(page)
    await dialog
      .getByRole('combobox', { name: /Tipo/ })
      .selectOption('TRANSFER')
    await selectFirstRealOption(
      dialog.getByRole('combobox', { name: /Cuenta origen/ }),
    )
    destination = dialog.getByRole('combobox', { name: /^Destino/ })
    await selectFirstRealOption(
      destination,
      'optgroup[label="CRÉDITOS"] option',
    )
    await expect(dialog.getByText('Registrar pago del crédito')).toBeVisible()
    await selectFirstRealOption(
      destination,
      'optgroup[label="CUENTAS Y TARJETAS"] option',
    )
    await expect(dialog.getByText('Registrar pago del crédito')).toHaveCount(0)
    await expect(dialog.getByText('Transferencia entre cuentas.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancelar' }).click()

    dialog = await openMovementForm(page)
    await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('INCOME')
    destination = dialog.getByRole('combobox', { name: /^Destino/ })
    await selectFirstRealOption(
      destination,
      'optgroup[label="CRÉDITOS"] option',
    )
    await expect(dialog.getByText('Registrar pago del crédito')).toBeVisible()
    await selectFirstRealOption(destination, 'optgroup[label="CUENTAS"] option')
    await expect(dialog.getByText('Registrar pago del crédito')).toHaveCount(0)
    await expect(dialog.getByLabel('Origen del ingreso')).toBeVisible()
    await expect(
      dialog.getByRole('button', { name: 'Categoría' }),
    ).toBeVisible()
  })
}
