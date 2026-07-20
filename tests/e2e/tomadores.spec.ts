import { expect, test } from '@playwright/test'

// RN-025/026/027/028 — jornada de Tomadores.
// Tests focados em: listagem (RN-025), criação (RN-025), e navegação.
// Testes de detail/tabs/addresses/appointments cobertos por E2E de habilitações pattern.

test.describe('Tomadores - RN-025 Listagem', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('lista tomadores com dados formatados', async ({ page }) => {
    await page.route('**/api/policy-holders*', route =>
      route.fulfill({
        json: {
          items: [{
            id: '01980000-0000-7000-8000-000000000010',
            documentNumber: '12345678000195',
            name: 'Acme Corporation Ltda.',
            socialName: 'Acme',
            isPrivateSector: true,
          }],
          page: 1,
          pageSize: 20,
          totalCount: 1,
        },
      }))

    await page.goto('/tomadores')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Tomadores' })).toBeVisible()
    await expect(page.getByText('1 tomador')).toBeVisible()
    await expect(page.getByText('Acme Corporation Ltda.')).toBeVisible()
    await expect(page.getByText('12.345.678/0001-95')).toBeVisible()
  })

  test('busca tomadores por nome/CNPJ', async ({ page }) => {
    let searchQuery: string | null = null

    await page.route('**/api/policy-holders*', async (route) => {
      const url = new URL(route.request().url())
      searchQuery = url.searchParams.get('search')
      await route.fulfill({
        json: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      })
    })

    await page.goto('/tomadores')
    await page.waitForLoadState('networkidle')
    await page.getByPlaceholder('Buscar por nome ou CNPJ').fill('São Paulo')
    await page.getByPlaceholder('Buscar por nome ou CNPJ').press('Enter')
    await page.waitForLoadState('networkidle')

    expect(searchQuery).toBe('São Paulo')
  })

  test('navega para nova tomador', async ({ page }) => {
    await page.route('**/api/policy-holders*', route =>
      route.fulfill({
        json: { items: [], page: 1, pageSize: 20, totalCount: 0 },
      }))

    await page.goto('/tomadores')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Novo tomador' }).click()

    await expect(page).toHaveURL('/tomadores/nova')
    await expect(page.getByRole('heading', { name: 'Novo tomador' })).toBeVisible()
  })

  test('botão Detalhes navega ao detalhe', async ({ page }) => {
    const policyHolderId = '01980000-0000-7000-8000-000000000010'

    await page.route('**/api/policy-holders*', async (route) => {
      const url = route.request().url()
      if (url.includes(`/${policyHolderId}`)) {
        // Detail endpoint
        await route.fulfill({
          json: {
            id: policyHolderId,
            documentNumber: '12345678000195',
            name: 'Acme Corporation Ltda.',
            socialName: 'Acme',
            isPrivateSector: true,
          },
        })
      }
      else {
        // List endpoint
        await route.fulfill({
          json: {
            items: [{
              id: policyHolderId,
              documentNumber: '12345678000195',
              name: 'Acme Corporation Ltda.',
              socialName: 'Acme',
              isPrivateSector: true,
            }],
            page: 1,
            pageSize: 20,
            totalCount: 1,
          },
        })
      }
    })

    await page.goto('/tomadores')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Detalhes' }).click()

    await expect(page).toHaveURL(`/tomadores/${policyHolderId}`)
  })
})

test.describe('Tomadores - RN-025 Criação', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('cria tomador buscando CNPJ', async ({ page }) => {
    let createdCnpj: string | null = null

    await page.route('**/api/policy-holders', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON() as { cnpj?: string }
        createdCnpj = body.cnpj ?? null
        await route.fulfill({
          status: 201,
          json: {
            id: '01980000-0000-7000-8000-000000000010',
            documentNumber: '12345678000195',
            name: 'Acme Corporation Ltda.',
            socialName: 'Acme',
            legalNatureCode: '2062',
            legalNatureDescription: 'Sociedade Anônima',
            isPrivateSector: true,
            mainAddress: null,
          },
        })
      }
      else {
        await route.continue()
      }
    })

    await page.goto('/tomadores/nova')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'CNPJ' }).fill('12345678000195')
    await page.getByRole('button', { name: 'Buscar CNPJ' }).click()

    await expect(page.getByText('Dados do tomador importados.')).toBeVisible()
    await expect(page.getByText('Acme Corporation Ltda.')).toBeVisible()
    expect(createdCnpj).toBe('12.345.678/0001-95')
  })

  test('exibe erro ao buscar CNPJ inválido', async ({ page }) => {
    await page.route('**/api/policy-holders', route =>
      route.fulfill({
        status: 400,
        json: { detail: 'CNPJ não encontrado no Birô.' },
      }))

    await page.goto('/tomadores/nova')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'CNPJ' }).fill('99999999999999')
    await page.getByRole('button', { name: 'Buscar CNPJ' }).click()

    await expect(page.getByText('CNPJ não encontrado no Birô.')).toBeVisible()
  })

  test('navega ao detalhe após criação', async ({ page }) => {
    const policyHolderId = '01980000-0000-7000-8000-000000000010'

    await page.route('**/api/policy-holders*', async (route) => {
      const url = route.request().url()
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: {
            id: policyHolderId,
            documentNumber: '12345678000195',
            name: 'Acme Corporation Ltda.',
            socialName: 'Acme',
            legalNatureCode: '2062',
            legalNatureDescription: 'Sociedade Anônima',
            isPrivateSector: true,
            mainAddress: null,
          },
        })
      }
      else if (url.includes(`/${policyHolderId}`)) {
        // Detail endpoint
        await route.fulfill({
          json: {
            id: policyHolderId,
            documentNumber: '12345678000195',
            name: 'Acme Corporation Ltda.',
            socialName: 'Acme',
            isPrivateSector: true,
          },
        })
      }
      else {
        await route.continue()
      }
    })

    await page.goto('/tomadores/nova')
    await page.waitForLoadState('networkidle')
    await page.getByRole('textbox', { name: 'CNPJ' }).fill('12345678000195')
    await page.getByRole('button', { name: 'Buscar CNPJ' }).click()
    await expect(page.getByText('Dados do tomador importados.')).toBeVisible()

    await page.getByRole('link', { name: 'Ver detalhes' }).click()
    await expect(page).toHaveURL(`/tomadores/${policyHolderId}`)
  })
})
