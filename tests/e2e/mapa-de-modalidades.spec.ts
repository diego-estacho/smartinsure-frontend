import { expect, test } from '@playwright/test'

// RN-033 (Mapa de Modalidades: matriz Seguradoras × Modalidades, oferta/ramos derivados) e
// RN-034 (Fila de Revisão na MESMA tela: mapear, promover ou ignorar) — jornadas de decisão.
// BFF mockado via page.route: o E2E exercita a UI real (matriz, fila, dialogs); o contrato é
// coberto por composable/BFF e backend.

const modalityId = '01990000-0000-7000-8000-000000000301'
const groupId = '01990000-0000-7000-8000-000000000101'
const importedModalityId = '01990000-0000-7000-8000-000000000401'
const insurerId = '01990000-0000-7000-8000-000000000501'

const group = {
  id: groupId,
  name: 'Fiança',
  description: null,
  displayOrder: 1,
  status: 'Active',
}

const modality = {
  id: modalityId,
  name: 'Fiança locatícia',
  modalityGroupId: groupId,
  modalityGroupName: 'Fiança',
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

const mappedEntry = {
  modalityId,
  name: 'Fiança locatícia',
  groupName: 'Fiança',
  status: 'Active',
  offered: true,
  branches: ['Private'],
  insurers: [
    {
      insurerId,
      insurerName: 'Seguradora Alfa',
      importedModalityId,
      originName: 'Seguro Fiança Residencial',
    },
  ],
}

const unofferedEntry = {
  modalityId,
  name: 'Fiança locatícia',
  groupName: 'Fiança',
  status: 'Active',
  offered: false,
  branches: [],
  insurers: [],
}

test.describe('RN-033/RN-034 Mapa de Modalidades — decisão da Fila', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')

    await page.route('**/api/modality-groups**', route =>
      route.fulfill({
        json: { items: [group], page: 1, pageSize: 100, totalCount: 1 },
      }))

    await page.route('**/api/modalities**', route =>
      route.fulfill({
        json: { items: [modality], page: 1, pageSize: 100, totalCount: 1 },
      }))
  })

  test('mapeia uma pendência para uma Modalidade existente (RN-034)', async ({ page }) => {
    let mappedBody: Record<string, unknown> | null = null

    // A Fila esvazia e a matriz passa a mostrar a Seguradora após o mapeamento confirmado.
    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: mappedBody
          ? { modalities: [mappedEntry], pending: [] }
          : { modalities: [unofferedEntry], pending: [pendingItem] },
      }))

    await page.route('**/api/imported-modalities/**', async (route) => {
      const request = route.request()
      if (request.url().endsWith('/map')) {
        mappedBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ json: { importedModalityId, modalityId, mappingStatus: 'Confirmed' } })
        return
      }
      await route.fulfill({ json: {} })
    })

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Mapa de Modalidades' })).toBeVisible()

    // A pendência está evidenciada na mesma tela (RN-034).
    await expect(page.getByRole('cell', { name: 'Seguro Fiança Residencial' })).toBeVisible()

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Mapear' }).first().click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Mapear Modalidade Importada')).toBeVisible()

    await dialog.getByLabel('Modalidade').click({ force: true })
    await page.getByRole('option', { name: 'Fiança locatícia' }).click()

    await dialog.getByRole('button', { name: 'Confirmar mapeamento' }).click()

    await expect(page.getByText('Modalidade Importada mapeada.')).toBeVisible()
    expect(mappedBody).toEqual({ modalityId })
    // A matriz agora mostra a Seguradora ofertando a Modalidade (RN-033).
    await expect(page.getByRole('cell', { name: 'Seguradora Alfa' })).toBeVisible()
  })

  test('ignora uma pendência com confirmação — sem excluir (RN-034/RN-036)', async ({ page }) => {
    let ignored = false

    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: ignored
          ? { modalities: [unofferedEntry], pending: [] }
          : { modalities: [unofferedEntry], pending: [pendingItem] },
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
})
