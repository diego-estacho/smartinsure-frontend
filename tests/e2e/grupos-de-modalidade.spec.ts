import { expect, test } from '@playwright/test'

// RN-029 (catálogo curado, escrita do Administrador) e RN-036 (preservação: nunca exclui,
// só alterna Ativa/Inativa) — jornada de cadastro de Grupo de Modalidade.
// BFF mockado via page.route: o E2E exercita a UI real (tabela, dialog de formulário e de
// situação); o contrato com o backend é coberto pelos testes de composable/BFF e pelo backend.

const groupId = '01990000-0000-7000-8000-000000000101'

const group = {
  id: groupId,
  name: 'Fiança',
  description: 'Grupo de fiança locatícia',
  displayOrder: 1,
  status: 'Active',
}

test.describe('RN-029 Grupo de Modalidade — cadastro', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('cria um Grupo de Modalidade pelo dialog (RN-029)', async ({ page }) => {
    let createdBody: Record<string, unknown> | null = null

    await page.route('**/api/modality-groups**', async (route) => {
      const request = route.request()

      if (request.method() === 'POST') {
        createdBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ status: 201, json: { ...group } })
        return
      }

      await route.fulfill({
        json: {
          items: createdBody ? [group] : [],
          page: 1,
          pageSize: 100,
          totalCount: createdBody ? 1 : 0,
        },
      })
    })

    await page.goto('/grupos-de-modalidade')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Grupos de Modalidade' })).toBeVisible()

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Novo Grupo de Modalidade' }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Novo Grupo de Modalidade')).toBeVisible()
    await dialog.getByLabel('Nome').fill('Fiança')
    await dialog.getByLabel('Descrição').fill('Grupo de fiança locatícia')
    await dialog.getByLabel('Ordem de exibição').fill('1')
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Grupo de Modalidade cadastrado.')).toBeVisible()
    expect(createdBody).not.toBeNull()
    expect(createdBody!.name).toBe('Fiança')
    expect(createdBody!.displayOrder).toBe(1)
    // RN-029: item curado nasce Ativo.
    expect(createdBody!.initialStatus).toBe('Active')

    await expect(page.getByRole('cell', { name: 'Fiança', exact: true })).toBeVisible()
  })

  test('inativa um Grupo com confirmação — sem opção de excluir (RN-036)', async ({ page }) => {
    let patchedBody: Record<string, unknown> | null = null

    await page.route('**/api/modality-groups**', async (route) => {
      const request = route.request()

      if (request.method() === 'PATCH') {
        patchedBody = request.postDataJSON() as Record<string, unknown>
        await route.fulfill({ json: { id: groupId, status: 'Inactive' } })
        return
      }

      await route.fulfill({
        json: {
          items: [patchedBody ? { ...group, status: 'Inactive' } : group],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      })
    })

    await page.goto('/grupos-de-modalidade')
    await page.waitForLoadState('networkidle')

    const row = page.getByRole('row', { name: /Fiança/ })
    await expect(row.getByRole('button', { name: 'Excluir' })).toHaveCount(0)
    await row.getByRole('button', { name: 'Inativar' }).click()

    const dialog = page.locator('.v-dialog')
    await expect(dialog.getByText('Inativar Grupo de Modalidade')).toBeVisible()
    await dialog.getByRole('button', { name: 'Confirmar' }).click()

    await expect(page.getByText('Grupo de Modalidade inativado.')).toBeVisible()
    expect(patchedBody).toEqual({ status: 'Inactive' })
    await expect(page.getByRole('cell', { name: 'Inativa' })).toBeVisible()
  })
})
