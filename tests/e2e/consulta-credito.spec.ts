import { expect, test, type Page } from '@playwright/test'

/**
 * RN-029/RN-030/RN-031 — jornada de Consulta de Crédito (componente CreditInquiryPanel, projeto `ui`).
 *
 * Mocka o BFF: `/api/me` (contexto/escopo ativo — RN-064, senão o shell redireciona no 401),
 * `/api/brokerages` (Corretora ativa) e `/api/credit-inquiries` (o resultado da consulta).
 * O motor devolve grupos por `groupType` estável (`GARANTIA_*`); a tela mapeia para as colunas fixas.
 */

const BROKERAGE = {
  id: '01980000-0000-7000-8000-000000000001',
  documentNumber: '11222333000144',
  name: 'Corretora Alfa Ltda.',
}

// CNPJ com dígito verificador VÁLIDO — RN-029 recusa CNPJ inválido antes de qualquer consulta.
const VALID_CNPJ = '12345678000195'

async function mockContextAndBrokerages(page: Page): Promise<void> {
  await page.route('**/api/me', route =>
    route.fulfill({
      json: {
        brokerages: [{
          id: BROKERAGE.id,
          name: BROKERAGE.name,
          documentNumber: BROKERAGE.documentNumber,
          profileName: 'Administrador',
        }],
        policyHolders: [],
        activeBrokerageId: BROKERAGE.id,
        activePolicyHolderId: null,
      },
    }))

  await page.route('**/api/brokerages*', route =>
    route.fulfill({
      json: {
        items: [{
          id: BROKERAGE.id,
          documentNumber: BROKERAGE.documentNumber,
          name: BROKERAGE.name,
          socialName: null,
          isPrivateSector: true,
          status: 'Active',
        }],
        page: 1,
        pageSize: 100,
        totalCount: 1,
      },
    }))
}

/** Resposta com 2 Seguradoras Aprovadas (A com 3 grupos, B só Tradicional) e 1 Indisponível (RN-030). */
function inquiryResponse() {
  return {
    creditInquiryId: '550e8400-e29b-41d4-a716-446655440000',
    queriedAt: '2026-07-20T14:30:00Z',
    policyHolderCnpj: VALID_CNPJ,
    policyHolderName: 'EMPRESA LTDA',
    summary: { insurersQueried: 3, insurersAvailable: 2, consolidatedLimit: 150000 },
    results: [
      {
        insurerId: 'ins-001',
        insurerName: 'Seguradora A',
        status: 'Available',
        failureReason: null,
        responseTimeMs: 820,
        limits: [
          { groupName: 'Tradicional', groupType: 'GARANTIA_TRADICIONAL', availableLimit: 50000, usedLimit: 0, rate: 2.5 },
          { groupName: 'Judicial', groupType: 'GARANTIA_JUDICIAL', availableLimit: 30000, usedLimit: 0, rate: 3.0 },
          { groupName: 'Financeira', groupType: 'GARANTIA_FINANCEIRA', availableLimit: 20000, usedLimit: 0, rate: 4.0 },
        ],
      },
      {
        insurerId: 'ins-002',
        insurerName: 'Seguradora B',
        status: 'Available',
        failureReason: null,
        responseTimeMs: 610,
        limits: [
          { groupName: 'Tradicional', groupType: 'GARANTIA_TRADICIONAL', availableLimit: 100000, usedLimit: 0, rate: 2.2 },
        ],
      },
      {
        insurerId: 'ins-003',
        insurerName: 'Seguradora C',
        status: 'Unavailable',
        failureReason: 'Indisponível no momento',
        responseTimeMs: null,
        limits: [],
      },
    ],
  }
}

function fillCnpj(page: Page, value: string) {
  return page.getByPlaceholder('CNPJ, nome ou razão social').fill(value)
}

test.describe('Consulta de Crédito — RN-029 execução', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
    await mockContextAndBrokerages(page)
  })

  test('CNPJ inválido é recusado antes de qualquer consulta', async ({ page }) => {
    let called = false
    await page.route('**/api/credit-inquiries', async (route) => {
      called = true
      await route.abort()
    })

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')
    await fillCnpj(page, '00000000000000')
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByText('CNPJ inválido')).toBeVisible()
    expect(called).toBe(false)
  })

  test('executa consulta por CNPJ e exibe KPIs + quadro consolidado', async ({ page }) => {
    await page.route('**/api/credit-inquiries', route => route.fulfill({ json: inquiryResponse() }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')
    await fillCnpj(page, VALID_CNPJ)
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    await expect(page.getByText('Seguradoras consultadas')).toBeVisible()
    await expect(page.getByText('Com limite aprovado')).toBeVisible()
    await expect(page.locator('.si-ci-table__desktop').getByText('Seguradora A')).toBeVisible()
    await expect(page.locator('.si-ci-status').filter({ hasText: 'Aprovado' }).first()).toBeVisible()
  })

  test('mapeia as colunas fixas por GroupType', async ({ page }) => {
    await page.route('**/api/credit-inquiries', route => route.fulfill({ json: inquiryResponse() }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')
    await fillCnpj(page, VALID_CNPJ)
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    for (const col of ['Seguradora', 'Status', 'Tradicional', 'Judicial', 'Financeira', 'Validade']) {
      await expect(page.locator('th', { hasText: new RegExp(col, 'i') }).first()).toBeVisible()
    }
  })
})

test.describe('Consulta de Crédito — RN-030 falha isolada', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
    await mockContextAndBrokerages(page)
  })

  test('Seguradora indisponível mostra status e motivo, sem derrubar as demais', async ({ page }) => {
    await page.route('**/api/credit-inquiries', route => route.fulfill({ json: inquiryResponse() }))

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')
    await fillCnpj(page, VALID_CNPJ)
    await page.getByRole('button', { name: 'Consultar' }).click()

    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    // As Aprovadas seguem visíveis…
    await expect(page.locator('.si-ci-table__desktop').getByText('Seguradora A')).toBeVisible()
    // …e a Indisponível aparece com o chip e o motivo.
    await expect(page.locator('.si-ci-table__desktop').getByText('Seguradora C')).toBeVisible()
    await expect(page.locator('.v-chip__content').filter({ hasText: 'Indisponível' }).first()).toBeVisible()
    await expect(page.getByText('Indisponível no momento').first()).toBeVisible()
  })
})

test.describe('Consulta de Crédito — RN-031 reconsulta', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')
    await mockContextAndBrokerages(page)
  })

  test('Reconsultar dispara uma nova consulta', async ({ page }) => {
    let count = 0
    await page.route('**/api/credit-inquiries', async (route) => {
      count += 1
      await route.fulfill({ json: { ...inquiryResponse(), creditInquiryId: `id-${count}` } })
    })

    await page.goto('/consulta-credito')
    await page.waitForLoadState('networkidle')
    await fillCnpj(page, VALID_CNPJ)
    await page.getByRole('button', { name: 'Consultar' }).click()
    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    expect(count).toBe(1)

    await page.getByRole('button', { name: 'Reconsultar' }).click()
    await expect(page.getByText('Quadro consolidado de limites')).toBeVisible()
    expect(count).toBe(2)
  })
})
