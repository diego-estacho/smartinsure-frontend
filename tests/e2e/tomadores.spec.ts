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

// RN-026/027/028 — detalhe do Tomador (painéis de endereços e nomeações),
// BFF mockado via page.route no padrão do insurer-enablements.spec.ts.
test.describe('Tomadores - detalhe (RN-026/027/028)', () => {
  const policyHolderId = '01980000-0000-7000-8000-000000000010'
  const brokerageAId = '01980000-0000-7000-8000-0000000000a1'
  const brokerageBId = '01980000-0000-7000-8000-0000000000b2'
  const insurerId = '01980000-0000-7000-8000-0000000000c3'

  const mainAddress = {
    id: '01980000-0000-7000-8000-0000000000d1',
    zipCode: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: null,
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    isMain: true,
  }
  const additionalAddress = {
    id: '01980000-0000-7000-8000-0000000000d2',
    zipCode: '04538133',
    street: 'Avenida Faria Lima',
    number: '4440',
    complement: 'Andar 10',
    neighborhood: 'Itaim Bibi',
    city: 'São Paulo',
    state: 'SP',
    isMain: false,
  }
  const activeAppointment = {
    id: '01980000-0000-7000-8000-0000000000e1',
    insurerId,
    insurerDocumentNumber: '98765432000109',
    insurerName: 'Seguradora Beta S.A.',
    brokerageId: brokerageAId,
    brokerageDocumentNumber: '11222333000144',
    brokerageName: 'Corretora Alfa Ltda.',
    status: 'Active',
    startedAt: '2026-07-01T12:00:00Z',
    endedAt: null,
  }
  const endedAppointment = {
    id: '01980000-0000-7000-8000-0000000000e2',
    insurerId,
    insurerDocumentNumber: '98765432000109',
    insurerName: 'Seguradora Beta S.A.',
    brokerageId: brokerageBId,
    brokerageDocumentNumber: '55666777000188',
    brokerageName: 'Corretora Gama Ltda.',
    status: 'Ended',
    startedAt: '2026-06-01T12:00:00Z',
    endedAt: '2026-07-01T12:00:00Z',
  }

  function detailJson(overrides: Record<string, unknown> = {}) {
    return {
      id: policyHolderId,
      documentNumber: '12345678000195',
      name: 'Acme Corporation Ltda.',
      socialName: 'Acme',
      legalNatureCode: '2062',
      legalNatureDescription: 'Sociedade Anônima',
      isPrivateSector: true,
      addresses: [mainAddress, additionalAddress],
      appointments: [activeAppointment, endedAppointment],
      ...overrides,
    }
  }

  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('endereços: principal com chip e sem ações; adicional com Editar/Remover (RN-026)', async ({ page }) => {
    await page.route(`**/api/policy-holders/${policyHolderId}`, route =>
      route.fulfill({ json: detailJson() }))

    await page.goto(`/tomadores/${policyHolderId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Endereços' }).click()

    const mainRow = page.getByRole('row', { name: /Avenida Paulista/ })
    await expect(mainRow.getByText('Principal')).toBeVisible()
    await expect(mainRow.getByRole('button', { name: 'Editar' })).toHaveCount(0)
    await expect(mainRow.getByRole('button', { name: 'Remover' })).toHaveCount(0)

    const additionalRow = page.getByRole('row', { name: /Avenida Faria Lima/ })
    await expect(additionalRow.getByRole('button', { name: 'Editar' })).toBeVisible()
    await expect(additionalRow.getByRole('button', { name: 'Remover' })).toBeVisible()
  })

  test('adiciona endereço adicional via dialog (RN-026)', async ({ page }) => {
    let addressPosted = false

    await page.route(`**/api/policy-holders/${policyHolderId}`, route =>
      route.fulfill({ json: detailJson() }))
    await page.route(`**/api/policy-holders/${policyHolderId}/addresses`, async (route) => {
      if (route.request().method() === 'POST') {
        addressPosted = true
        await route.fulfill({ status: 201, json: { ...additionalAddress, id: '01980000-0000-7000-8000-0000000000d3' } })
      }
      else {
        await route.continue()
      }
    })

    await page.goto(`/tomadores/${policyHolderId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Endereços' }).click()

    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Novo endereço' }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    await dialog.getByLabel('CEP').fill('04538133')
    await dialog.getByLabel('Rua').fill('Avenida Faria Lima')
    await dialog.getByLabel('Número').fill('4440')
    await dialog.getByLabel('Bairro').fill('Itaim Bibi')
    await dialog.getByLabel('Cidade').fill('São Paulo')
    await dialog.getByLabel('UF').click({ force: true })
    await page.getByRole('option', { name: 'SP' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect.poll(() => addressPosted).toBe(true)
  })

  test('nomeações listam Vigente e Encerrada com período (RN-027/RN-028)', async ({ page }) => {
    await page.route(`**/api/policy-holders/${policyHolderId}`, route =>
      route.fulfill({ json: detailJson() }))

    await page.goto(`/tomadores/${policyHolderId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Nomeações' }).click()

    const activeRow = page.getByRole('row', { name: /Corretora Alfa/ })
    await expect(activeRow.getByText('Vigente')).toBeVisible()
    await expect(activeRow.getByText(/Desde 2026-07-01/)).toBeVisible()

    const endedRow = page.getByRole('row', { name: /Corretora Gama/ })
    await expect(endedRow.getByText('Encerrada')).toBeVisible()
    await expect(endedRow.getByText('2026-06-01 a 2026-07-01')).toBeVisible()
    await expect(endedRow.getByRole('button', { name: 'Encerrar' })).toHaveCount(0)
  })

  test('substituição pede confirmação e faz POST único, sem end prévio (RN-028)', async ({ page }) => {
    let appointmentPosted = false
    let endPatched = false

    await page.route(`**/api/policy-holders/${policyHolderId}`, route =>
      route.fulfill({ json: detailJson() }))
    await page.route('**/api/brokerages**', route =>
      route.fulfill({
        json: {
          items: [
            { id: brokerageAId, documentNumber: '11222333000144', name: 'Corretora Alfa Ltda.', socialName: null, isPrivateSector: true, status: 'Active' },
            { id: brokerageBId, documentNumber: '55666777000188', name: 'Corretora Gama Ltda.', socialName: null, isPrivateSector: true, status: 'Active' },
          ],
          page: 1,
          pageSize: 100,
          totalCount: 2,
        },
      }))
    await page.route('**/api/insurers**', route =>
      route.fulfill({
        json: {
          items: [{ id: insurerId, cnpj: '98765432000109', corporateName: 'Seguradora Beta S.A.', tradeName: null, logoUrl: null, status: 'Active' }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))
    await page.route(`**/api/policy-holders/${policyHolderId}/appointments`, async (route) => {
      if (route.request().method() === 'POST') {
        appointmentPosted = true
        await route.fulfill({
          status: 201,
          json: { id: '01980000-0000-7000-8000-0000000000e9', policyHolderId, brokerageId: brokerageBId, insurerId, status: 'Active', startedAt: '2026-07-20T12:00:00Z', endedAt: null },
        })
      }
      else {
        await route.continue()
      }
    })
    await page.route(`**/api/policy-holders/${policyHolderId}/appointments/*/end`, async (route) => {
      endPatched = true
      await route.fulfill({ json: { ...activeAppointment, status: 'Ended', endedAt: '2026-07-20T12:00:00Z' } })
    })

    await page.goto(`/tomadores/${policyHolderId}`)
    await page.waitForLoadState('networkidle')
    // Reclica se a hidratação ainda não anexou o handler (SSR + Suspense).
    await expect(async () => {
      await page.getByRole('button', { name: 'Nova nomeação' }).click()
      await expect(page.locator('.v-dialog')).toBeVisible({ timeout: 1500 })
    }).toPass({ timeout: 15_000 })

    const dialog = page.locator('.v-dialog')
    // Vuetify: o wrapper .v-field__input intercepta o clique do input do select.
    await dialog.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Gama Ltda.' }).click()
    await dialog.getByLabel('Seguradora').click({ force: true })
    await page.getByRole('option', { name: 'Seguradora Beta S.A.' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText(/Substituirá a nomeação vigente da corretora Corretora Alfa/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await expect.poll(() => appointmentPosted).toBe(true)
    expect(endPatched).toBe(false)
  })

  test('encerra nomeação Vigente com confirmação (RN-028)', async ({ page }) => {
    let endPatched = false

    await page.route(`**/api/policy-holders/${policyHolderId}`, route =>
      route.fulfill({ json: detailJson() }))
    await page.route(`**/api/policy-holders/${policyHolderId}/appointments/${activeAppointment.id}/end`, async (route) => {
      endPatched = true
      await route.fulfill({ json: { ...activeAppointment, status: 'Ended', endedAt: '2026-07-20T12:00:00Z' } })
    })

    await page.goto(`/tomadores/${policyHolderId}`)
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Nomeações' }).click()
    await page.getByRole('button', { name: 'Encerrar' }).click()

    await expect(page.getByText('Encerrar nomeação?')).toBeVisible()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await expect.poll(() => endPatched).toBe(true)
  })
})
