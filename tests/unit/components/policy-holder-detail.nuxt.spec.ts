// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createError } from 'h3'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import PolicyHolderDetailPage from '~/pages/tomadores/[id].vue'
import { formatCnpj } from '~/lib/documents'

// RN-025/RN-052 — a ficha do Tomador ganha uma seção de Filiais ao lado de Endereços e
// Nomeações. `GET /policy-holders/{id}` já traz `branches[]` (Task 6) especificamente para a
// ficha renderizar sem chamada extra — por isso a seção lê da prop vinda do detalhe, nunca de
// `listBranches` (esse composable é do wizard de cotação, Task 9/10).
const POLICY_HOLDER_ID = 'ph-1'

function detailJson(overrides: Record<string, unknown> = {}) {
  return {
    id: POLICY_HOLDER_ID,
    documentNumber: '12345678000190',
    name: 'Construtora Aurora Engenharia LTDA',
    socialName: null,
    legalNatureCode: null,
    legalNatureDescription: null,
    isPrivateSector: null,
    addresses: [],
    appointments: [],
    branches: [],
    ...overrides,
  }
}

/** A aba "Filiais" é lazy (VTabsWindowItem sem `eager`) — precisa ser clicada para o conteúdo
 * nascer no DOM, igual às abas de Endereços/Nomeações nos E2Es existentes. */
async function openBranchesTab(w: Awaited<ReturnType<typeof mountSuspended>>) {
  const tab = w.findAllComponents({ name: 'VTab' }).find(t => t.text().includes('Filiais'))
  await tab!.trigger('click')
  await flushPromises()
}

describe('Ficha do Tomador — seção Filiais (RN-025/RN-052)', () => {
  it('renderiza as Filiais vindas do detalhe, sem chamar o endpoint de listagem', async () => {
    // Middleware global de auth (ADR-007): sem sessão, a navegação para a ficha redireciona pro
    // login — precisa "logar" o teste antes de montar a página.
    registerEndpoint('/api/auth/session', { method: 'GET', handler: () => ({ authenticated: true }) })

    let listBranchesCalled = false
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}`, {
      method: 'GET',
      handler: () => detailJson({
        branches: [
          { id: 'br-1', documentNumber: '11222333000262', name: 'Filial SP', socialName: null },
        ],
      }),
    })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}/branches`, {
      method: 'GET',
      handler: () => {
        listBranchesCalled = true
        return { branches: [] }
      },
    })

    const w = await mountSuspended(PolicyHolderDetailPage, { route: `/tomadores/${POLICY_HOLDER_ID}` })
    await flushPromises()
    await openBranchesTab(w)

    expect(w.text()).toContain('Filial SP')
    expect(w.text()).toContain(formatCnpj('11222333000262'))
    // Discrimina a decisão de design: se a seção virasse uma segunda chamada a `listBranches`
    // em vez de ler `branches[]` do detalhe, este assert cairia — não é vácuo.
    expect(listBranchesCalled).toBe(false)
  })

  it('sem Filiais, mostra o estado vazio', async () => {
    registerEndpoint('/api/auth/session', { method: 'GET', handler: () => ({ authenticated: true }) })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}`, {
      method: 'GET',
      handler: () => detailJson(),
    })

    const w = await mountSuspended(PolicyHolderDetailPage, { route: `/tomadores/${POLICY_HOLDER_ID}` })
    await flushPromises()
    await openBranchesTab(w)

    expect(w.text()).toContain('Nenhuma filial registrada.')
  })
})

describe('Ficha do Tomador — registrar Filial por CNPJ, três desfechos (RN-052)', () => {
  /** Abre a aba Filiais, clica "Nova filial" (botão da área de ações da aba, distinto do botão
   * homônimo dentro do dialog), preenche o CNPJ e submete — mesmo três-desfechos do
   * `Step1PolicyHolder.vue`, só que aqui pela ficha. */
  async function openFillAndSubmitBranchModal(w: Awaited<ReturnType<typeof mountSuspended>>, cnpj: string) {
    await openBranchesTab(w)
    const openBtn = w.findAllComponents({ name: 'VBtn' }).find(b => b.text().includes('Nova filial'))
    await openBtn!.trigger('click')
    // SiDocField renderiza o rótulo estático fora do VTextField (SiFieldShell) — sem `label` como
    // prop do VTextField pra filtrar; o campo do dialog é sempre o último VTextField na árvore.
    const cnpjField = w.findAllComponents({ name: 'VTextField' }).at(-1)
    await cnpjField!.find('input').setValue(cnpj)
    const submitBtn = w.findAllComponents({ name: 'VBtn' })
      .find(b => b.text() === 'Salvar')
    await submitBtn!.trigger('click')
    await flushPromises()
  }

  it('branchId presente: fecha o dialog e recarrega o detalhe (a lista some a chamar listBranches)', async () => {
    registerEndpoint('/api/auth/session', { method: 'GET', handler: () => ({ authenticated: true }) })
    let detailCalls = 0
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}`, {
      method: 'GET',
      handler: () => {
        detailCalls += 1
        return detailCalls === 1
          ? detailJson()
          : detailJson({ branches: [{ id: 'br-new', documentNumber: '11222333000262', name: 'Filial Nova', socialName: null }] })
      },
    })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}/branches`, {
      method: 'POST',
      once: true,
      handler: () => ({ headquartersId: POLICY_HOLDER_ID, branchId: 'br-new', notice: null }),
    })

    const w = await mountSuspended(PolicyHolderDetailPage, { route: `/tomadores/${POLICY_HOLDER_ID}` })
    await flushPromises()
    await openFillAndSubmitBranchModal(w, '11222333000262')

    await vi.waitFor(() => expect(w.text()).toContain('Filial Nova'))
    expect(detailCalls).toBeGreaterThanOrEqual(2)
    // A aba Filiais é a única ativa no momento (as outras abas são lazy) — o único SiDialog na
    // árvore é o de "Nova filial".
    const dialog = w.findComponent({ name: 'SiDialog' })
    expect(dialog.props('modelValue')).toBe(false)
  })

  it('branchId nulo + notice: Birô não achou o CNPJ — mostra o aviso (info), dialog continua aberto', async () => {
    registerEndpoint('/api/auth/session', { method: 'GET', handler: () => ({ authenticated: true }) })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}`, {
      method: 'GET',
      handler: () => detailJson(),
    })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}/branches`, {
      method: 'POST',
      once: true,
      handler: () => ({ headquartersId: POLICY_HOLDER_ID, branchId: null, notice: 'CNPJ não encontrado no Birô.' }),
    })

    const w = await mountSuspended(PolicyHolderDetailPage, { route: `/tomadores/${POLICY_HOLDER_ID}` })
    await flushPromises()
    await openFillAndSubmitBranchModal(w, '99999999000199')

    const infoAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--info'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(infoAlert.text()).toContain('CNPJ não encontrado no Birô.')
    const dialog = w.findComponent({ name: 'SiDialog' })
    expect(dialog.props('modelValue')).toBe(true)
  })

  it('falha de rede (exceção): mostra o aviso de erro, distinto do notice do Birô', async () => {
    registerEndpoint('/api/auth/session', { method: 'GET', handler: () => ({ authenticated: true }) })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}`, {
      method: 'GET',
      handler: () => detailJson(),
    })
    registerEndpoint(`/api/policy-holders/${POLICY_HOLDER_ID}/branches`, {
      method: 'POST',
      once: true,
      handler: () => {
        throw createError({ statusCode: 500, statusMessage: 'Erro interno simulado' })
      },
    })

    const w = await mountSuspended(PolicyHolderDetailPage, { route: `/tomadores/${POLICY_HOLDER_ID}` })
    await flushPromises()
    await openFillAndSubmitBranchModal(w, '11222333000262')

    const errorAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--error'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(errorAlert.text()).toContain('Não foi possível registrar a filial.')
  })
})
