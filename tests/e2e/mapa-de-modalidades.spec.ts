import { expect, test } from '@playwright/test'

// RN-033 (Mapa de Modalidades: matriz Seguradoras × Modalidades, oferta/ramos derivados; o backend
// já agrega uma badge por Seguradora com count/origins — ADR-061) e RN-034 (Fila de Revisão na
// MESMA tela, só curadoria: Reatribuir, Ignorar, Reativar) — jornadas de decisão.
// BFF mockado via page.route: o E2E exercita a UI real (matriz, fila, dialogs); o contrato é
// coberto por composable/BFF e backend.

const modalityId = '01990000-0000-7000-8000-000000000301'
const importedModalityId = '01990000-0000-7000-8000-000000000401'
const insurerId = '01990000-0000-7000-8000-000000000501'

const modality = {
  id: modalityId,
  name: 'Fiança locatícia',
  description: 'Garantia de aluguel',
  status: 'Active',
}

const pendingItem = {
  importedModalityId,
  insurerId,
  insurerName: 'Seguradora Alfa',
  originName: 'Seguro Fiança Residencial',
  branch: 'Private',
  engineModalityName: 'FIANCA_RES',
  groupName: 'Fianças',
}

// ADR-061: o backend já agrega uma entrada por Seguradora (count + origins) — sem groupName.
const linkedEntry = {
  modalityId,
  name: 'Fiança locatícia',
  status: 'Active',
  offered: true,
  branches: ['Private'],
  insurers: [
    {
      insurerId,
      insurerName: 'Seguradora Alfa',
      count: 2,
      origins: ['Seguro Fiança Residencial', 'Seguro Fiança Comercial'],
    },
  ],
}

const unlinkedEntry = {
  modalityId,
  name: 'Fiança locatícia',
  status: 'Active',
  offered: false,
  branches: [],
  insurers: [],
}

test.describe('RN-033/RN-034 Mapa de Modalidades — decisão da Fila', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')

    await page.route('**/api/modalities**', route =>
      route.fulfill({
        json: { items: [modality], page: 1, pageSize: 100, totalCount: 1 },
      }))
  })

  test('a matriz mostra UMA badge por Seguradora com a contagem agregada (RN-033)', async ({ page }) => {
    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: { modalities: [linkedEntry], pending: [] },
      }))

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Mapa de Modalidades' })).toBeVisible()

    // A badge da Seguradora aparece uma vez com a contagem de Modalidades Importadas (2).
    await expect(page.getByRole('cell', { name: /Seguradora Alfa/ })).toBeVisible()
    await expect(page.getByRole('cell', { name: /Seguradora Alfa/ })).toContainText('2')
    await expect(page.getByText('Nenhuma pendência na Fila de Revisão.')).toBeVisible()
  })

  test('reatribui uma pendência para uma Modalidade (RN-034)', async ({ page }) => {
    let reassignedBody: Record<string, unknown> | null = null

    // A Fila esvazia e a matriz passa a mostrar a Seguradora após a reatribuição.
    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: reassignedBody
          ? { modalities: [linkedEntry], pending: [] }
          : { modalities: [unlinkedEntry], pending: [pendingItem] },
      }))

    await page.route('**/api/imported-modalities/**', async (route) => {
      const request = route.request()
      if (request.url().endsWith('/reassign')) {
        reassignedBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ json: { importedModalityId, modalityId, linkSource: 'Manual' } })
        return
      }
      await route.fulfill({ json: {} })
    })

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')

    // A exceção está evidenciada na mesma tela (RN-034).
    await expect(page.getByRole('cell', { name: 'Seguro Fiança Residencial' })).toBeVisible()

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Reatribuir' }).first().click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Reatribuir Modalidade Importada')).toBeVisible()

    await dialog.getByLabel('Modalidade').click({ force: true })
    await page.getByRole('option', { name: 'Fiança locatícia' }).click()

    await dialog.getByRole('button', { name: 'Confirmar reatribuição' }).click()

    await expect(page.getByText('Modalidade Importada reatribuída.')).toBeVisible()
    expect(reassignedBody).toEqual({ modalityId })
    // A matriz agora mostra a Seguradora ofertando a Modalidade (RN-033).
    await expect(page.getByRole('cell', { name: /Seguradora Alfa/ })).toBeVisible()
  })

  test('ignora uma pendência com confirmação — sem excluir (RN-034/RN-036)', async ({ page }) => {
    let ignored = false

    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: ignored
          ? { modalities: [unlinkedEntry], pending: [] }
          : { modalities: [unlinkedEntry], pending: [pendingItem] },
      }))

    await page.route('**/api/imported-modalities/**', async (route) => {
      const request = route.request()
      if (request.url().endsWith('/ignore')) {
        ignored = true
        await route.fulfill({ json: { importedModalityId, ignored: true } })
        return
      }
      await route.fulfill({ json: {} })
    })

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('cell', { name: 'Seguro Fiança Residencial' })).toBeVisible()

    await expect(async () => {
      await page.getByRole('button', { name: 'Ignorar' }).first().click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Ignorar Modalidade Importada')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByText('Modalidade Importada ignorada.')).toBeVisible()
    expect(ignored).toBe(true)
    // A Fila esvaziou.
    await expect(page.getByText('Nenhuma pendência na Fila de Revisão.')).toBeVisible()
  })

  test('reativa uma pendência direto, sem dialog (RN-034)', async ({ page }) => {
    let restored = false

    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: restored
          ? { modalities: [unlinkedEntry], pending: [] }
          : { modalities: [unlinkedEntry], pending: [pendingItem] },
      }))

    await page.route('**/api/imported-modalities/**', async (route) => {
      const request = route.request()
      if (request.url().endsWith('/restore')) {
        restored = true
        await route.fulfill({ json: { importedModalityId, ignored: false } })
        return
      }
      await route.fulfill({ json: {} })
    })

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('cell', { name: 'Seguro Fiança Residencial' })).toBeVisible()

    await expect(async () => {
      await page.getByRole('button', { name: 'Reativar' }).first().click()
      await expect(page.getByText('Modalidade Importada reativada.')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    expect(restored).toBe(true)
    await expect(page.getByText('Nenhuma pendência na Fila de Revisão.')).toBeVisible()
  })
})
