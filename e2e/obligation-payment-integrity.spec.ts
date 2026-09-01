import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const api = (path: string) => `http://127.0.0.1:3000/api/v1${path}`

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /contraseña/i }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await page.waitForURL(/\/app(?:\/|$)/)
}

async function data<T>(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.ok()).toBe(true)
  return (await response.json()).data as T
}

test('corrige cuenta, protege movimiento, revierte y vuelve a pagar sin desincronizar', async ({
  page,
  request,
}) => {
  const runId = Date.now().toString(36)
  const auth = await request.post(api('/auth/login'), { data: { email, password } })
  const token = (await auth.json()).data.tokens.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }
  const workspaces = await data<Array<{ id: string }>>(
    await request.get(api('/workspaces'), { headers }),
  )
  const workspaceId = workspaces[0]!.id
  const base = `/workspaces/${workspaceId}`
  const createAccount = async (name: string) =>
    data<{ id: string }>(
      await request.post(api(`${base}/accounts`), {
        headers,
        data: {
          name,
          type: 'E_WALLET',
          nature: 'ASSET',
          currency: 'COP',
          openingBalance: '500000',
        },
      }),
    )
  const cash = await createAccount(`Efectivo integridad ${runId}`)
  const nequi = await createAccount(`Nequi integridad ${runId}`)
  const obligation = await data<{ id: string }>(
    await request.post(api(`${base}/obligations`), {
      headers,
      data: {
        name: `Internet integridad ${runId}`,
        expectedAmount: '100000',
        currency: 'COP',
        amountType: 'FIXED',
        frequency: 'MONTHLY',
        startsOn: '2026-10-15',
      },
    }),
  )
  const detail = await data<{ occurrences: Array<{ id: string }> }>(
    await request.get(api(`${base}/obligations/${obligation.id}`), { headers }),
  )
  const occurrenceId = detail.occurrences[0]!.id
  const paid = await data<{ transactionId: string }>(
    await request.post(
      api(`${base}/obligations/${obligation.id}/occurrences/${occurrenceId}/payments`),
      {
        headers,
        data: {
          accountId: cash.id,
          amount: '100000',
          occurredAt: '2026-10-15T12:00:00Z',
          idempotencyKey: `e2e-obligation-${runId}`,
        },
      },
    ),
  )

  await login(page)
  await page.goto(`/app/debts/obligations/${obligation.id}`)
  await page.getByRole('button', { name: 'Editar pago' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar pago' })
  await edit.getByRole('combobox', { name: 'Cuenta pagadora' }).selectOption(nequi.id)
  await expect(edit.getByText(/Efectivo integridad.*recuperará/)).toBeVisible()
  await edit.getByRole('button', { name: 'Guardar corrección' }).click()
  await expect(edit).toBeHidden()

  const accountsAfterEdit = await data<Array<{ id: string; currentBalance: string }>>(
    await request.get(api(`${base}/accounts`), { headers }),
  )
  expect(accountsAfterEdit.find((account) => account.id === cash.id)?.currentBalance).toBe(
    '500000.00',
  )
  expect(accountsAfterEdit.find((account) => account.id === nequi.id)?.currentBalance).toBe(
    '400000.00',
  )

  const transactionResponse = await request.get(
    api(`${base}/transactions/${paid.transactionId}`),
    { headers },
  )
  expect((await transactionResponse.json()).data.accountId).toBe(nequi.id)
  const protectedDelete = await request.delete(
    api(`${base}/transactions/${paid.transactionId}`),
    { headers, data: { version: 2 } },
  )
  expect(protectedDelete.status()).toBe(409)
  await page.getByRole('button', { name: 'Revertir pago' }).click()
  const reverse = page.getByRole('dialog', { name: 'Revertir pago' })
  await reverse.getByLabel('Motivo').fill('Cuenta origen corregida en prueba E2E')
  await reverse.getByRole('button', { name: 'Confirmar reversión' }).click()
  await expect(reverse).toBeHidden()
  await expect(page.getByText(/Pagado.*0,00/).first()).toBeVisible()

  const accountsAfterReverse = await data<Array<{ id: string; currentBalance: string }>>(
    await request.get(api(`${base}/accounts`), { headers }),
  )
  expect(accountsAfterReverse.find((account) => account.id === nequi.id)?.currentBalance).toBe(
    '500000.00',
  )

  await page.getByRole('button', { name: 'Pagar', exact: true }).first().click()
  const repay = page.getByRole('dialog', { name: 'Registrar pago recurrente' })
  await repay.getByRole('combobox', { name: 'Cuenta pagadora' }).selectOption(nequi.id)
  await repay.getByRole('button', { name: 'Confirmar' }).click()
  await expect(repay).toBeHidden()
  await expect(page.getByText(/Pagado.*100\.000,00/).first()).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: new RegExp(`Internet integridad ${runId}`) })).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true)
})
