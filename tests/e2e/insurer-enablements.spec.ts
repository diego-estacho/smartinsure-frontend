import { expect, test } from '@playwright/test'

// RN-022/RN-023 — jornada de Habilitação de Seguradora na tela da Corretora.
// BFF mockado via page.route: o E2E exercita a UI real (aba, dialogs, campos
// dinâmicos do PlugV2 e serialização JSON); o contrato com o backend é coberto
// pelos testes de composable e pelo backend.

const brokerageId = '01980000-0000-7000-8000-000000000001'
const insurerId = '01980000-0000-7000-8000-000000000002'
const enablementId = '01980000-0000-7000-8000-000000000003'

const brokerage = {
  id: brokerageId,
  documentNumber: '12345678000195',
  name: 'Corretora Alfa Ltda.',
  socialName: null,
  legalNatureCode: null,
  legalNatureName: null,
  isPrivateSector: true,
  status: 'Active',
  mainAddress: null,
}

const enablement = {
  id: enablementId,
  brokerageId,
  brokerageName: 'Corretora Alfa Ltda.',
  insurerId,
  insurerCorporateName: 'Seguradora Beta S.A.',
  calculationEngine: 'PlugV2',
  status: 'Active',
}

test.describe('RN-022 Habilitação de Seguradora — jornada na tela da Corretora', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')

    await page.route(`**/api/brokerages/${brokerageId}`, route =>
      route.fulfill({ json: brokerage }))

    await page.route('**/api/insurers**', route =>
      route.fulfill({
        json: {
          items: [{ id: insurerId, cnpj: '98765432000109', corporateName: 'Seguradora Beta S.A.', tradeName: null, logoUrl: null, status: 'Active' }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/calculation-engines', route =>
      route.fulfill({ json: [{ name: 'PlugV2' }] }))
  })

  test('habilita seguradora com PlugV2 serializando baseUrl/key em JSON', async ({ page }) => {
    let createdBody: Record<string, unknown> | null = null

    await page.route('**/api/brokerage-insurer-enablements**', async (route) => {
      const request = route.request()

      if (request.method() === 'POST') {
        createdBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ status: 201, json: { ...enablement, connectionParameters: createdBody?.connectionParameters ?? null } })
        return
      }

      await route.fulfill({ json: { items: createdBody ? [enablement] : [], page: 1, pageSize: 100, totalCount: createdBody ? 1 : 0 } })
    })

    await page.goto(`/corretoras/${brokerageId}`)
    await expect(page.getByRole('tab', { name: 'Habilitações de Seguradora' })).toBeVisible()
    await expect(page.getByText('Nenhuma seguradora habilitada para esta corretora.')).toBeVisible()
    await page.waitForLoadState('networkidle')

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Habilitar seguradora' }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Habilitar seguradora')).toBeVisible()

    // Vuetify: o wrapper .v-field__input intercepta o clique do input do select.
    await dialog.getByLabel('Seguradora').click({ force: true })
    await page.getByRole('option', { name: 'Seguradora Beta S.A.' }).click()

    await dialog.getByLabel('Motor de cálculo').click({ force: true })
    await page.getByRole('option', { name: 'PlugV2' }).click()

    // RN-022: motor PlugV2 exibe os campos exigidos pelo motor.
    await dialog.getByLabel('Base URL').fill('https://plug.example.com')
    await dialog.getByLabel('Key', { exact: true }).fill('chave-secreta')

    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Seguradora habilitada.')).toBeVisible()
    expect(createdBody).not.toBeNull()
    expect(createdBody!.brokerageId).toBe(brokerageId)
    expect(createdBody!.insurerId).toBe(insurerId)
    expect(createdBody!.calculationEngine).toBe('PlugV2')
    expect(JSON.parse(String(createdBody!.connectionParameters))).toEqual({
      baseUrl: 'https://plug.example.com',
      key: 'chave-secreta',
    })

    await expect(page.getByRole('cell', { name: 'Seguradora Beta S.A.' })).toBeVisible()
  })

  test('inativa habilitação com confirmação — sem opção de excluir', async ({ page }) => {
    let patchedBody: Record<string, unknown> | null = null

    await page.route('**/api/brokerage-insurer-enablements**', async (route) => {
      const request = route.request()

      if (request.method() === 'PATCH') {
        patchedBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ json: { id: enablementId, status: 'Inactive' } })
        return
      }

      await route.fulfill({
        json: {
          items: [patchedBody ? { ...enablement, status: 'Inactive' } : enablement],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      })
    })

    await page.goto(`/corretoras/${brokerageId}`)

    const row = page.getByRole('row', { name: /Seguradora Beta/ })
    await expect(row.getByRole('button', { name: 'Excluir' })).toHaveCount(0)

    await row.getByRole('button', { name: 'Inativar' }).click()

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Inativar habilitação')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByText('Habilitação inativada.')).toBeVisible()
    expect(patchedBody).toEqual({ status: 'Inactive' })
    await expect(page.getByRole('cell', { name: 'Inativa' })).toBeVisible()
  })
})
