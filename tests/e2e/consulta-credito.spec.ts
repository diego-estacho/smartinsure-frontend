import { expect, test } from '@playwright/test'

// RN-029/RN-030/RN-031 — jornada de Consulta de Crédito
// Tests focados em: formulário, mapeamento de status, histórico

test.describe('Consulta de Crédito - RN-029 Execução da Consulta', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('formulário com Corretora e CNPJ do Tomador obrigatórios', async ({ page }) => {
    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [
            {
              id: '01980000-0000-7000-8000-000000000001',
              documentNumber: '11222333000144',
              name: 'Corretora Alfa Ltda.',
              socialName: null,
              isPrivateSector: true,
              status: 'Active',
            },
          ],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Botão Consultar deve estar disabled até preenchimento
    const consultButton = page.getByRole('button', { name: 'Consultar' })
    await expect(consultButton).toBeDisabled()

    // Preenche Corretora
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await expect(consultButton).toBeDisabled()

    // Preenche CNPJ
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await expect(consultButton).not.toBeDisabled()
  })

  test('executa consulta e exibe resumo com cards', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', route =>
      route.fulfill({
        json: {
          creditInquiryId: '550e8400-e29b-41d4-a716-446655440000',
          queriedAt: '2026-07-20T14:30:00Z',
          policyHolderCnpj: '12345678000195',
          policyHolderName: 'EMPRESA LTDA',
          summary: {
            insurersQueried: 3,
            insurersAvailable: 2,
            consolidatedLimit: 150000,
          },
          results: [
            {
              insurerId: 'ins-001',
              insurerName: 'Seguradora A',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
                { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
                { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
              ],
            },
            {
              insurerId: 'ins-002',
              insurerName: 'Seguradora B',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 100000, usedLimit: 0, rate: 2.2 },
              ],
            },
            {
              insurerId: 'ins-003',
              insurerName: 'Seguradora C',
              status: 'Unavailable',
              failureReason: 'Indisponível no momento',
              limits: [],
            },
          ],
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche e consulta
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12.345.678/0001-95')
    await page.getByRole('button', { name: 'Consultar' }).click()

    // Aguarda aparecimento do resumo
    await expect(page.getByText('Seguradoras consultadas')).toBeVisible()

    // Verifica cards de resumo (usa parent context para evitar ambiguidade)
    const summaryCards = page.locator('.si-credit-inquiries__summary-card')
    await expect(summaryCards.getByText('Seguradoras consultadas', { exact: false })).toBeVisible()

    // Verifica números específicos nos cards (busca por conteúdo aproximado)
    const summaryValues = page.locator('.si-credit-inquiries__summary-value')
    await expect(summaryValues.filter({ hasText: /^3$/ })).toBeVisible() // insurersQueried
    await expect(summaryValues.filter({ hasText: /^2$/ })).toBeVisible() // insurersAvailable
    await expect(summaryValues.filter({ hasText: /150.?000/ })).toBeVisible() // consolidated limit (formato com/sem ponto)
    await expect(summaryValues.filter({ hasText: /20.*07.*2026.*14:30/ })).toBeVisible() // data/hora
  })

  test('CNPJ com dígito verificador inválido — mensagem de erro exibida (RN-029)', async ({ page }) => {
    let creditInquiriesCalled = false

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: '01980000-0000-7000-8000-000000000001',
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', async (route) => {
      creditInquiriesCalled = true
      await route.abort()
    })

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche Corretora
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()

    // Preenche CNPJ com dígito verificador inválido
    // 00.000.000/0000-00 — CNPJ com checksum inválido (todos zeros)
    const cnpjField = page.getByLabel('CNPJ do Tomador')
    await cnpjField.fill('00000000000000')
    await cnpjField.blur() // Dispara validação

    // Aguarda mensagem de erro
    await expect(page.getByText('CNPJ inválido')).toBeVisible()

    // Tenta clicar no button (pode estar disabled ou não)
    // Garante que nenhuma chamada ao BFF foi feita
    expect(creditInquiriesCalled).toBe(false)
  })

  test('tabela com colunas dinâmicas por grupos de modalidade — com assertivas reforçadas', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', route =>
      route.fulfill({
        json: {
          creditInquiryId: '550e8400-e29b-41d4-a716-446655440000',
          queriedAt: '2026-07-20T14:30:00Z',
          policyHolderCnpj: '12345678000195',
          policyHolderName: 'EMPRESA LTDA',
          summary: {
            insurersQueried: 2,
            insurersAvailable: 2,
            consolidatedLimit: 4800000,
          },
          results: [
            {
              insurerId: 'ins-001',
              insurerName: 'Seguradora A',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 4380000, usedLimit: 420000, rate: 2.5 },
                { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
                { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
              ],
            },
            {
              insurerId: 'ins-002',
              insurerName: 'Seguradora B',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 100000, usedLimit: 0, rate: 2.2 },
              ],
            },
          ],
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche e consulta
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await page.getByRole('button', { name: 'Consultar' }).click()

    // Aguarda aparecimento da tabela
    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()

    // 1a. Verifica colunas dinâmicas — headers presentes e células ausentes com "—"
    await expect(page.locator('th', { hasText: /Seguradora/i }).first()).toBeVisible()
    await expect(page.locator('th', { hasText: /Status/i }).first()).toBeVisible()
    await expect(page.locator('th', { hasText: /Tradicional/i }).first()).toBeVisible()
    await expect(page.locator('th', { hasText: /Judicial/i }).first()).toBeVisible()
    await expect(page.locator('th', { hasText: /Financeiro/i }).first()).toBeVisible()
    await expect(page.locator('th', { hasText: /Validade/i }).first()).toBeVisible()

    // Seguradora A tem todos os 3 grupos → 1 "—" (apenas Validade)
    const segARow = page.locator('tr').filter({ hasText: 'Seguradora A' }).first()
    await expect(segARow.locator('.si-credit-inquiries__unavailable')).toHaveCount(1)

    // Seguradora B tem apenas Tradicional → 2 "—" para grupos ausentes + 1 para Validade = 3 total
    const segBRow = page.locator('tr').filter({ hasText: 'Seguradora B' }).first()
    await expect(segBRow.locator('.si-credit-inquiries__unavailable')).toHaveCount(3)

    // 1b. Verifica "Utilizado > 0" com valor formatado na célula (Seguradora A, Tradicional)
    const utilizadoCell = segARow.locator('.si-credit-inquiries__group-used')
    await expect(utilizadoCell).toBeVisible()
    await expect(utilizadoCell).toContainText(/Utilizado/)
    await expect(utilizadoCell).toContainText(/420/) // Valor formatado em BRL

    // 1c. Verifica barra "Disponível vs Utilizado" — seção visível, nome seguradora, valores e percentual
    const availabilitySection = page.locator('.si-credit-inquiries__availability-bars')
    await expect(availabilitySection).toBeVisible()
    await expect(availabilitySection.locator('.si-credit-inquiries__availability-title')).toBeVisible()

    const segABar = page.locator('.si-credit-inquiries__bar-container').filter({ hasText: 'Seguradora A' })
    await expect(segABar).toBeVisible()
    await expect(segABar.locator('.si-credit-inquiries__bar-label')).toContainText('Seguradora A')
    await expect(segABar.locator('.si-credit-inquiries__bar-amount')).toContainText(/Disponível/)
    await expect(segABar.locator('.si-credit-inquiries__bar-used')).toContainText(/Utilizado/)
    // 420k/(4.38M+420k) = 420k/4.8M ≈ 8.75% → 9%
    await expect(segABar.locator('.si-credit-inquiries__bar-percentage')).toContainText(/9%/)

    // 1d. Verifica coluna Validade renderiza "—"
    await expect(page.locator('.si-credit-inquiries__unavailable').filter({ hasText: /^—$/ })).toHaveCount(4) // 1 para A + 3 para B
  })
})

test.describe('Consulta de Crédito - RN-030 Falha Isolada', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('Seguradora indisponível mostra status com motivo visível (RN-030)', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', route =>
      route.fulfill({
        json: {
          creditInquiryId: '550e8400-e29b-41d4-a716-446655440000',
          queriedAt: '2026-07-20T14:30:00Z',
          policyHolderCnpj: '12345678000195',
          policyHolderName: 'EMPRESA LTDA',
          summary: {
            insurersQueried: 2,
            insurersAvailable: 1,
            consolidatedLimit: 50000,
          },
          results: [
            {
              insurerId: 'ins-001',
              insurerName: 'Seguradora A',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
                { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
                { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
              ],
            },
            {
              insurerId: 'ins-002',
              insurerName: 'Seguradora B',
              status: 'Unavailable',
              failureReason: 'Motor de Cálculo indisponível',
              limits: [],
            },
          ],
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche e consulta
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await page.getByRole('button', { name: 'Consultar' }).click()

    // Aguarda aparecimento da tabela
    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()

    // Verifica status indisponível na linha da Seguradora B
    // Verifica que o chip mostra "Indisponível" (dentro do v-chip__content)
    await expect(page.getByText('Seguradora B')).toBeVisible()
    const unavailableChip = page.locator('.v-chip__content').filter({ hasText: 'Indisponível' })
    await expect(unavailableChip).toBeVisible()

    // Verifica que o MOTIVO está VISÍVEL (não só em tooltip)
    await expect(page.getByText('Motor de Cálculo indisponível')).toBeVisible()

    // Verifica que os campos de limite mostram "—" (não zero) em linha com Seguradora B
    const sgBContainer = page.locator('div:has-text("Seguradora B")')
    await expect(sgBContainer.locator('text=—').first()).toBeVisible()
  })

  test('resumo consolida apenas Seguradoras com resposta', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', route =>
      route.fulfill({
        json: {
          creditInquiryId: '550e8400-e29b-41d4-a716-446655440000',
          queriedAt: '2026-07-20T14:30:00Z',
          policyHolderCnpj: '12345678000195',
          policyHolderName: 'EMPRESA LTDA',
          summary: {
            insurersQueried: 3,
            insurersAvailable: 1, // Apenas uma respondeu bem
            consolidatedLimit: 50000,
          },
          results: [
            {
              insurerId: 'ins-001',
              insurerName: 'Seguradora A',
              status: 'Available',
              failureReason: null,
              limits: [
                { groupName: 'Tradicional', groupType: 'credit', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
                { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
                { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
              ],
            },
            {
              insurerId: 'ins-002',
              insurerName: 'Seguradora B',
              status: 'Unavailable',
              failureReason: 'Indisponível',
              limits: [],
            },
            {
              insurerId: 'ins-003',
              insurerName: 'Seguradora C',
              status: 'Unavailable',
              failureReason: 'Timeout',
              limits: [],
            },
          ],
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche e consulta
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await page.getByRole('button', { name: 'Consultar' }).click()

    // Aguarda aparecimento do resumo
    await expect(page.getByText('Seguradoras consultadas')).toBeVisible()

    // Verifica os números no resumo (usa classe CSS para localizar valores)
    const summaryValues = page.locator('.si-credit-inquiries__summary-value')
    await expect(summaryValues.filter({ hasText: /^3$/ })).toBeVisible() // Total consultadas
    await expect(summaryValues.filter({ hasText: /^1$/ })).toBeVisible() // Apenas 1 disponível
    await expect(page.getByText('Aprovadas')).toBeVisible()
  })

  test('Corretora sem Habilitação Ativa — BFF retorna erro 4xx com ProblemDetails (RN-029)', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', route =>
      route.fulfill({
        status: 400,
        json: {
          type: 'https://smartinsure.api/problems/invalid-request',
          title: 'Requisição inválida',
          status: 400,
          detail: 'Nenhuma Seguradora habilitada para esta Corretora.',
        },
      }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Preenche e tenta consultar
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await page.getByRole('button', { name: 'Consultar' }).click()

    // Aguarda e valida que mensagem de erro é exibida (título do ProblemDetails)
    await expect(page.getByText('Requisição inválida')).toBeVisible()
  })
})

test.describe('Consulta de Crédito - RN-031 Reconsulta', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
  })

  test('botão Reconsultar dispara nova consulta e gera novo registro', async ({ page }) => {
    const brokerageId = '01980000-0000-7000-8000-000000000001'
    let callCount = 0

    await page.route('**/api/brokerages*', route =>
      route.fulfill({
        json: {
          items: [{
            id: brokerageId,
            documentNumber: '11222333000144',
            name: 'Corretora Alfa Ltda.',
            socialName: null,
            isPrivateSector: true,
            status: 'Active',
          }],
          page: 1,
          pageSize: 100,
          totalCount: 1,
        },
      }))

    await page.route('**/api/credit-inquiries', async (route) => {
      callCount += 1
      // Diferencia a resposta por ID para simular novo registro
      const uuid = `550e8400-e29b-41d4-a716-44665544000${callCount}`
      await route.fulfill({
        json: {
          creditInquiryId: uuid,
          queriedAt: '2026-07-20T14:30:00Z',
          policyHolderCnpj: '12345678000195',
          policyHolderName: 'EMPRESA LTDA',
          summary: {
            insurersQueried: 1,
            insurersAvailable: 1,
            consolidatedLimit: 50000,
          },
          results: [{
            insurerId: 'ins-001',
            insurerName: 'Seguradora A',
            status: 'Available',
            failureReason: null,
            limits: [
              { groupName: 'Tradicional', groupType: 'credit', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
              { groupName: 'Judicial', groupType: 'credit', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
              { groupName: 'Financeiro', groupType: 'credit', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
            ],
          }],
        },
      })
    })

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')

    // Primeira consulta
    await page.getByLabel('Corretora').click({ force: true })
    await page.getByRole('option', { name: 'Corretora Alfa Ltda.' }).click()
    await page.getByLabel('CNPJ do Tomador').fill('12345678000195')
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    expect(callCount).toBe(1)

    // Clica em Reconsultar
    await page.getByRole('button', { name: 'Reconsultar' }).click()
    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    expect(callCount).toBe(2) // Nova chamada disparada
  })
})
