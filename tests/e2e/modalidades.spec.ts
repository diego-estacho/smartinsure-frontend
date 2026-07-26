import { expect, test } from '@playwright/test'

// RN-032 (catálogo importado e curado; sem Grupo de Modalidade no lado Smart — ADR-061) e RN-039
// (preservação: nunca exclui, só alterna Ativa/Inativa) — jornada de cadastro de Modalidade.
// BFF mockado via page.route: o E2E exercita a UI real (tabela, dialog de formulário e dialog de
// situação); o contrato é coberto por composable/BFF e backend.

const modalityId = '01990000-0000-7000-8000-000000000201'

const modality = {
  id: modalityId,
  name: 'Fiança locatícia',
  description: 'Garantia de aluguel',
  status: 'Active',
}

test.describe('RN-032 Modalidade — cadastro', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('cria uma Modalidade sem Grupo (RN-032/ADR-061)', async ({ page }) => {
    let createdBody: Record<string, unknown> | null = null

    await page.route('**/api/modalities**', async (route) => {
      const request = route.request()

      if (request.method() === 'POST') {
        createdBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ status: 201, json: { ...modality } })
        return
      }

      await route.fulfill({
        json: {
          items: createdBody ? [modality] : [],
          page: 1,
          pageSize: 100,
          totalCount: createdBody ? 1 : 0,
        },
      })
    })

    await page.goto('/modalidades')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Modalidades' })).toBeVisible()

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Nova Modalidade' }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Nova Modalidade')).toBeVisible()
    await dialog.getByLabel('Nome').fill('Fiança locatícia')

    // ADR-061: não há campo Grupo de Modalidade no formulário.
    await expect(dialog.getByLabel('Grupo de Modalidade')).toHaveCount(0)

    await dialog.getByLabel('Descrição').fill('Garantia de aluguel')
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Modalidade cadastrada.')).toBeVisible()
    expect(createdBody).not.toBeNull()
    expect(createdBody!.name).toBe('Fiança locatícia')
    // ADR-061: o payload não carrega Grupo.
    expect(createdBody!.modalityGroupId).toBeUndefined()
    // RN-032: item curado nasce Ativo.
    expect(createdBody!.initialStatus).toBe('Active')

    await expect(page.getByRole('cell', { name: 'Fiança locatícia' })).toBeVisible()
  })

  test('inativa uma Modalidade com confirmação — sem opção de excluir (RN-039)', async ({ page }) => {
    let patchedBody: Record<string, unknown> | null = null

    await page.route('**/api/modalities**', async (route) => {
      const request = route.request()

      if (request.method() === 'PATCH') {
        patchedBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ json: { id: modalityId, status: 'Inactive' } })
        return
      }

      await route.fulfill({
        json: {
          items: [patchedBody ? { ...modality, status: 'Inactive' } : modality],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      })
    })

    await page.goto('/modalidades')
    await page.waitForLoadState('networkidle')

    const row = page.getByRole('row', { name: /Fiança locatícia/ })
    await expect(row.getByRole('button', { name: 'Excluir' })).toHaveCount(0)
    await row.getByRole('button', { name: 'Inativar' }).click()

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Inativar Modalidade')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByText('Modalidade inativada.')).toBeVisible()
    expect(patchedBody).toEqual({ status: 'Inactive' })
    await expect(page.getByRole('cell', { name: 'Inativa' })).toBeVisible()
  })
})
