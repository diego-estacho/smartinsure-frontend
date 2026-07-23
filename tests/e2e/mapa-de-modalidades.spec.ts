import { expect, test } from '@playwright/test'

// RN-036 (Mapa de Modalidades: matriz Seguradoras × Modalidades, oferta/ramos derivados; o backend
// já agrega uma badge por Seguradora com count/origins — ADR-061).
// A Fila de Revisão (RN-037) está OCULTA por feature-flag (OPEN-14): a implementação permanece
// (composable/BFF/dialogs, cobertos por testes unitários), mas não é exibida por padrão. Quando o
// cadastro manual / tratamento de exceções for decidido, reabilita-se a flag e voltam as jornadas
// de ação da Fila (Reatribuir/Ignorar/Reativar) neste E2E.
// BFF mockado via page.route: o E2E exercita a UI real (matriz); o contrato é coberto por composable/BFF.

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

test.describe('RN-036 Mapa de Modalidades — matriz (Fila oculta por flag OPEN-14)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.request.post('/api/auth/dev-login')

    await page.route('**/api/modalities**', route =>
      route.fulfill({
        json: { items: [modality], page: 1, pageSize: 100, totalCount: 1 },
      }))
  })

  test('mostra UMA badge por Seguradora com contagem agregada; Fila oculta por padrão (RN-036/OPEN-14)', async ({ page }) => {
    // Há pendência no payload, mas a Fila NÃO deve aparecer (feature-flag desligada por padrão).
    await page.route('**/api/modality-map**', route =>
      route.fulfill({
        json: { modalities: [linkedEntry], pending: [pendingItem] },
      }))

    await page.goto('/mapa-de-modalidades')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Mapa de Modalidades' })).toBeVisible()

    // A matriz mostra a badge da Seguradora uma vez, com a contagem de Modalidades Importadas (2).
    await expect(page.getByRole('cell', { name: /Seguradora Alfa/ })).toBeVisible()
    await expect(page.getByRole('cell', { name: /Seguradora Alfa/ })).toContainText('2')

    // Fila oculta por feature-flag (OPEN-14): sem a seção nem os botões de ação, mesmo havendo pendência.
    await expect(page.getByRole('heading', { name: 'Fila de Revisão' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Reatribuir' })).toHaveCount(0)
  })
})
