import { expect, test, type Page } from '@playwright/test'

const email = 'e2e-fynar@example.com'
const password = 'E2E secure password 1!'
const api = (path: string) => `http://127.0.0.1:3000/api/v1${path}`

async function loginUi(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/correo/i).fill(email)
  await page.getByRole('textbox', { name: /Contraseña/ }).fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/app\//)
}

test('crea Universidad con preview real, ordena, archiva y desarchiva el mismo registro', async ({
  page,
  request,
}) => {
  const runId = Date.now().toString(36)
  const login = await request.post(api('/auth/login'), { data: { email, password } })
  const token = (await login.json()).data.tokens.accessToken as string
  const headers = { Authorization: `Bearer ${token}` }
  const workspaceId = (await (await request.get(api('/workspaces'), { headers })).json()).data[0].id
  const base = `/workspaces/${workspaceId}/categories`
  const oldName = `Mascotas ${runId}`
  const universityName = `Universidad ${runId}`
  expect(
    (
      await request.post(api(base), {
        headers,
        data: { name: oldName, type: 'EXPENSE', icon: 'pet', color: '#38A169' },
      })
    ).status(),
  ).toBe(201)

  await loginUi(page)
  await page.goto('/app/categories')
  await page.getByRole('button', { name: 'Nueva categoría' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nueva categoría' })
  await expect(dialog.getByText('Categoría (opcional)')).toHaveCount(0)
  await dialog.getByRole('textbox', { name: /Nombre/ }).fill(universityName)
  await dialog.getByRole('combobox', { name: /Tipo/ }).selectOption('EXPENSE')
  await dialog.getByText('Seleccionar icono').click()
  await dialog.getByRole('button', { name: 'Educación' }).last().click()
  const preview = dialog.getByRole('region', { name: 'Vista previa de categoría' })
  const previewIcon = preview.getByTestId('category-identity-icon')
  await dialog.getByRole('radio', { name: 'Verde', exact: true }).click()
  await expect(previewIcon).toHaveAttribute('data-category-color', '#38A169')
  await dialog.getByRole('radio', { name: 'Azul' }).click()
  await expect(previewIcon).toHaveAttribute('data-category-color', '#3182CE')
  await dialog.getByRole('radio', { name: 'Violeta' }).click()
  await expect(previewIcon).toHaveAttribute('data-category-color', '#6B46C1')
  await expect(previewIcon).toHaveAttribute('data-category-icon', 'graduation-cap')
  const previewBackground = await previewIcon.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  )

  const createRequest = page.waitForRequest(
    (candidate) => candidate.url().endsWith('/categories') && candidate.method() === 'POST',
  )
  const createResponse = page.waitForResponse(
    (candidate) => candidate.url().endsWith('/categories') && candidate.request().method() === 'POST',
  )
  await dialog.getByRole('button', { name: 'Crear categoría' }).click()
  const sent = (await createRequest).postDataJSON()
  expect(sent).toMatchObject({
    name: universityName,
    type: 'EXPENSE',
    icon: 'graduation-cap',
    color: '#6B46C1',
  })
  expect(sent).not.toHaveProperty('parentId')
  const created = (await (await createResponse).json()).data
  await expect(page.getByRole('heading', { name: universityName })).toBeVisible()

  const categoryList = page.getByLabel('Lista de categorías')
  const headings = await categoryList.getByRole('heading').allTextContents()
  expect(headings.indexOf(universityName)).toBeLessThan(headings.indexOf(oldName))
  const systemName = await categoryList.getByText('Sistema', { exact: true }).first().locator('../../..').getByRole('heading').textContent()
  expect(headings.indexOf(oldName)).toBeLessThan(headings.indexOf(systemName!))
  const categoryCard = page.getByRole('heading', { name: universityName }).locator('../../..')
  const listedIcon = categoryCard.getByTestId('category-identity-icon')
  expect(await listedIcon.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
    previewBackground,
  )
  await expect(listedIcon).toHaveAttribute('data-category-icon', 'graduation-cap')

  await categoryCard.getByRole('button', { name: 'Archivar' }).click()
  const archiveDialog = page.getByRole('dialog', { name: 'Archivar categoría' })
  await expect(archiveDialog).toContainText('conservará su historial')
  await expect(page.getByRole('dialog', { name: 'Eliminar categoría' })).toHaveCount(0)
  await archiveDialog.getByRole('button', { name: 'Archivar' }).click()
  await expect(page.getByRole('heading', { name: universityName })).toHaveCount(0)
  const activeAfterArchive = await (await request.get(api(`${base}?status=ACTIVE`), { headers })).json()
  expect(activeAfterArchive.data.some((item: { id: string }) => item.id === created.id)).toBe(false)

  await page.getByText('Filtros', { exact: true }).click()
  await page.getByRole('combobox', { name: 'Estado' }).selectOption('ARCHIVED')
  await expect(page.getByRole('heading', { name: universityName })).toBeVisible()
  const archivedCard = page.getByRole('heading', { name: universityName }).locator('../../..')
  await expect(archivedCard.getByTestId('category-identity-icon')).toHaveAttribute(
    'data-category-color',
    '#6B46C1',
  )
  await archivedCard.getByRole('button', { name: 'Desarchivar' }).click()
  await expect(page.getByRole('heading', { name: universityName })).toHaveCount(0)

  await page.getByRole('combobox', { name: 'Estado' }).selectOption('ACTIVE')
  await expect(page.getByRole('heading', { name: universityName })).toBeVisible()
  const restored = (await (await request.get(api(`${base}/${created.id}`), { headers })).json()).data
  expect(restored).toMatchObject({
    id: created.id,
    name: universityName,
    icon: 'graduation-cap',
    color: '#6B46C1',
    createdAt: created.createdAt,
    isActive: true,
  })
})
