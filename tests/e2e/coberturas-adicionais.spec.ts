import { expect, test } from '@playwright/test'

// RN-040 (Cobertura Adicional canônica: catálogo curado, nunca criada pela importação; nunca exclui,
// só alterna Ativa/Inativa — RN-044) e RN-043 (vínculo MANUAL da Importada à canônica; sem vínculo
// fica pendente de mapeamento, evidente na curadoria). Diferente do Mapa de Modalidades, a Fila de
// pendências NÃO é ocultada por feature-flag. Curadoria numa única tela.
// BFF mockado via page.route: o E2E exercita a UI real (catálogo, fila e dialogs); o contrato é
// coberto por composable/BFF e backend.

const coverageId = '01990000-0000-7000-8000-000000000601'
const importedCoverageId = '01990000-0000-7000-8000-000000000701'
const importedModalityId = '01990000-0000-7000-8000-000000000801'

const canonical = {
  id: coverageId,
  name: 'Multa',
  status: 'Active',
  linked: [
    {
      importedCoverageId,
      insurerName: 'Seguradora Alfa',
      modalityName: 'Fiança locatícia',
      coverageName: 'Multa Contratual',
    },
  ],
}

const pendingItem = {
  id: '01990000-0000-7000-8000-000000000702',
  importedModalityId,
  insurerName: 'Seguradora Beta',
  modalityName: 'Fiança comercial',
  coverageName: 'Danos ao Imóvel',
}

test.describe('RN-040/RN-043 Coberturas Adicionais — curadoria', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('mostra o catálogo canônico com a Importada vinculada e a Fila de pendências sempre visível (RN-043)', async ({ page }) => {
    await page.route('**/api/additional-coverage-map**', route =>
      route.fulfill({ json: { coverages: [canonical], pending: [pendingItem] } }))

    await page.goto('/coberturas-adicionais')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Coberturas Adicionais', exact: true })).toBeVisible()

    // Catálogo canônico: a Cobertura Adicional e sua Importada vinculada.
    await expect(page.getByRole('cell', { name: /Multa/ }).first()).toBeVisible()
    await expect(page.getByText('Multa Contratual').first()).toBeVisible()

    // A Fila de pendências é SEMPRE visível (sem feature-flag): mostra a pendente e a ação Vincular.
    await expect(page.getByRole('heading', { name: 'Pendentes de mapeamento' })).toBeVisible()
    await expect(page.getByText('Danos ao Imóvel')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Vincular', exact: true })).toBeVisible()
  })

  test('vincula uma Importada pendente à Cobertura Adicional canônica (RN-043)', async ({ page }) => {
    let linkedBody: Record<string, unknown> | null = null

    await page.route('**/api/imported-additional-coverages/*/link', async (route) => {
      linkedBody = route.request().postDataJSON() as Record<string, unknown>
      await route.fulfill({ json: { importedCoverageId: pendingItem.id, additionalCoverageId: coverageId } })
    })

    await page.route('**/api/additional-coverage-map**', route =>
      route.fulfill({
        json: {
          coverages: [canonical],
          pending: linkedBody ? [] : [pendingItem],
        },
      }))

    await page.goto('/coberturas-adicionais')
    await page.waitForLoadState('networkidle')

    await expect(async () => {
      await page.getByRole('button', { name: 'Vincular', exact: true }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Vincular Cobertura Adicional Importada')).toBeVisible()

    // Escolhe a canônica alvo no select. Vuetify: o wrapper .v-field__input intercepta o clique.
    await dialog.getByLabel('Cobertura Adicional').click({ force: true })
    await page.getByRole('option', { name: 'Multa' }).click()
    await dialog.getByRole('button', { name: 'Confirmar vínculo' }).click()

    await expect(page.getByText('Cobertura Adicional Importada vinculada.')).toBeVisible()
    expect(linkedBody).toEqual({ additionalCoverageId: coverageId })
  })

  test('inativa uma Cobertura Adicional com confirmação — sem opção de excluir (RN-044)', async ({ page }) => {
    let inactivated = false

    await page.route('**/api/additional-coverages/*/inactivate', async (route) => {
      inactivated = true
      await route.fulfill({ json: { id: coverageId, status: 'Inactive' } })
    })

    await page.route('**/api/additional-coverage-map**', route =>
      route.fulfill({
        json: {
          coverages: [inactivated ? { ...canonical, status: 'Inactive' } : canonical],
          pending: [],
        },
      }))

    await page.goto('/coberturas-adicionais')
    await page.waitForLoadState('networkidle')

    const row = page.getByRole('row', { name: /Multa/ }).first()
    await expect(row.getByRole('button', { name: 'Excluir' })).toHaveCount(0)
    await row.getByRole('button', { name: 'Inativar' }).click()

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Inativar Cobertura Adicional')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByText('Cobertura Adicional inativada.')).toBeVisible()
    expect(inactivated).toBe(true)
    await expect(page.getByRole('cell', { name: 'Inativa' })).toBeVisible()
  })
})
