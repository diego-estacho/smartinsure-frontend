// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createError, setResponseStatus } from 'h3'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import Wizard from '~/components/quotation-groups/Wizard.vue'
import EntryStep from '~/components/quotation-groups/EntryStep.vue'
import SummarySidebar from '~/components/quotation-groups/SummarySidebar.vue'
import Step4Quotations from '~/components/quotation-groups/Step4Quotations.vue'
import MinutaClauses from '~/components/quotation-groups/MinutaClauses.vue'
import Step5Issuance from '~/components/quotation-groups/Step5Issuance.vue'
import Step2Insured from '~/components/quotation-groups/Step2Insured.vue'
import Step1PolicyHolder from '~/components/quotation-groups/Step1PolicyHolder.vue'
import type { Quotation } from '~/composables/useQuotations'
import { usePersons } from '~/composables/usePersons'
import { useQuotationGroups } from '~/composables/useQuotationGroups'
import { buildObjetoTemplate, parseTemplate } from '~/lib/minuta'
import { formatCnpj } from '~/lib/documents'
import { useQuotationGroupWizardStore, WIZARD_STEPS } from '~/stores/quotationGroupWizard'

/** Força o desktop (>=1024) para o wizard nascer em 2 colunas com o SiStepper (não o compacto). */
function forceDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
  window.dispatchEvent(new Event('resize'))
}

/** Cotação (shape real da API) para os testes de store/resumo. */
function makeQuote(over: Partial<Quotation> = {}): Quotation {
  return {
    id: 'newe',
    insurerId: 'i-newe',
    name: 'Newe Seguros',
    logoUrl: null,
    premio: 300,
    comissao: 25,
    limite: 1_928_991,
    status: 'auto',
    taxa: 0.42,
    tags: [],
    result: 'ReadyForEmission',
    analysisTrack: null,
    isFollowable: true,
    requiresCcg: false,
    ccgSigned: false,
    ccgMaxLimitWithoutNeed: null,
    ...over,
  }
}

// A store vem do contexto Nuxt (a mesma que os componentes montados usam); resetamos entre os
// testes em vez de criar uma Pinia própria — senão o estado manipulado no teste não chega ao
// componente. Manipular a store ANTES do mount deixa o componente nascer no estado desejado.
describe('quotationGroupWizard — store do fluxo (exec-plan 0015)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
  })

  it('nasce na tela de entrada, escopo "todas", sem seguradoras', () => {
    const w = useQuotationGroupWizardStore()
    expect(w.phase).toBe('entry')
    expect(w.currentStep).toBe(0)
    expect(w.scope).toEqual({ mode: 'all', insurerIds: [] })
    expect(w.canStart).toBe(true)
  })

  it('escopo específico sem seguradora bloqueia o início', () => {
    const w = useQuotationGroupWizardStore()
    w.scope.mode = 'specific'
    expect(w.canStart).toBe(false)
    expect(w.startOffer()).toBe(false)
    expect(w.phase).toBe('entry')
  })

  it('escopo específico com uma seguradora inicia o fluxo', () => {
    const w = useQuotationGroupWizardStore()
    w.scope.mode = 'specific'
    w.scope.insurerIds.push('newe')
    expect(w.canStart).toBe(true)
    expect(w.startOffer()).toBe(true)
    expect(w.phase).toBe('steps')
    expect(w.currentStep).toBe(0)
  })

  it('avança e volta pelas etapas; voltar do passo 1 retorna à entrada', () => {
    const w = useQuotationGroupWizardStore()
    w.startOffer()
    expect(w.isFirstStep).toBe(true)
    w.goNext()
    expect(w.currentStep).toBe(1)
    w.goBack()
    expect(w.currentStep).toBe(0)
    w.goBack()
    expect(w.phase).toBe('entry')
  })

  it('não avança além da última etapa', () => {
    const w = useQuotationGroupWizardStore()
    w.startOffer()
    for (let i = 0; i < WIZARD_STEPS.length + 2; i++) w.goNext()
    expect(w.currentStep).toBe(WIZARD_STEPS.length - 1)
    expect(w.isLastStep).toBe(true)
  })

  it('goToStep só permite voltar a etapas já alcançadas', () => {
    const w = useQuotationGroupWizardStore()
    w.startOffer()
    w.goNext()
    w.goNext()
    w.goToStep(4)
    expect(w.currentStep).toBe(2)
    w.goToStep(0)
    expect(w.currentStep).toBe(0)
  })

  it('reset volta ao estado inicial', () => {
    const w = useQuotationGroupWizardStore()
    w.scope.mode = 'specific'
    w.scope.insurerIds.push('newe')
    w.startOffer()
    w.goNext()
    w.reset()
    expect(w.phase).toBe('entry')
    expect(w.currentStep).toBe(0)
    expect(w.scope).toEqual({ mode: 'all', insurerIds: [] })
  })
})

describe('QuotationGroupsEntryStep — tela de entrada mock (exec-plan 0015)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('"específicas" sem seguradora mostra erro ao iniciar e não avança', async () => {
    const store = useQuotationGroupWizardStore()
    store.scope.mode = 'specific'
    const w = await mountSuspended(EntryStep)
    const startBtn = w.findAll('button').find(b => b.text().includes('Iniciar oferta'))
    await startBtn!.trigger('click')
    expect(w.text()).toContain('Selecione ao menos uma seguradora')
    expect(store.phase).toBe('entry')
  })

  it('selecionar uma seguradora do grid permite iniciar o fluxo', async () => {
    const store = useQuotationGroupWizardStore()
    store.scope.mode = 'specific'
    const w = await mountSuspended(EntryStep)
    await w.findAll('.si-qg-entry__insurer')[0]!.trigger('click')
    expect(store.scope.insurerIds.length).toBe(1)
    const startBtn = w.findAll('button').find(b => b.text().includes('Iniciar oferta'))
    await startBtn!.trigger('click')
    expect(store.phase).toBe('steps')
  })
})

describe('QuotationGroupsWizard — moldura do fluxo (exec-plan 0015)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('começa na tela de entrada (pergunta de escopo)', async () => {
    const w = await mountSuspended(Wizard)
    expect(w.text()).toContain('Como você quer cotar esta oferta?')
    expect(w.text()).toContain('Iniciar oferta')
  })

  it('após iniciar, mostra o stepper, a primeira etapa e o rodapé', async () => {
    useQuotationGroupWizardStore().startOffer()
    const w = await mountSuspended(Wizard)
    const text = w.text()
    expect(text).toContain('Dados do tomador')
    expect(text).toContain('Continuar')
    expect(text).toContain('Voltar')
  })

  it('no último passo, a ação primária vira "Emitir"', async () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    for (let i = 0; i < WIZARD_STEPS.length - 1; i++) store.goNext()
    const w = await mountSuspended(Wizard)
    expect(w.text()).toContain('Emitir')
  })
})

describe('Etapa 1 — Dados do tomador (exec-plan 0015, incremento 2)', () => {
  const SAMPLE = {
    id: 'ph-1',
    name: 'Construtora Aurora Engenharia LTDA',
    documentNumber: '12345678000190',
    mainAddress: 'Av. das Nações Unidas, 1200 · São Paulo - SP',
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('validateCurrentStep exige o tomador no passo 1 e libera após selecioná-lo', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    expect(store.validateCurrentStep()).toContain('Busque e selecione o tomador')
    store.setPolicyHolder(SAMPLE)
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa o tomador selecionado', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(SAMPLE)
    store.reset()
    expect(store.policyHolder).toBeNull()
  })

  it('o rodapé bloqueia avançar sem tomador e mostra o erro', async () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    const w = await mountSuspended(Wizard)
    const btn = w.findAll('button').find(b => b.text().includes('Continuar'))
    await btn!.trigger('click')
    expect(w.text()).toContain('Busque e selecione o tomador para continuar')
    expect(store.currentStep).toBe(0)
  })

  it('o rodapé avança quando há tomador selecionado', async () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    store.setPolicyHolder(SAMPLE)
    const w = await mountSuspended(Wizard)
    const btn = w.findAll('button').find(b => b.text().includes('Continuar'))
    await btn!.trigger('click')
    expect(store.currentStep).toBe(1)
  })

  it('o resumo mostra o tomador selecionado', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(SAMPLE)
    const w = await mountSuspended(SummarySidebar)
    expect(w.text()).toContain('Construtora Aurora Engenharia LTDA')
  })
})

describe('Etapa 1 — Filial do tomador (RN-102)', () => {
  const HOLDER = {
    id: 'ph-1',
    name: 'Construtora Aurora Engenharia LTDA',
    documentNumber: '12345678000190',
    mainAddress: 'Av. das Nações Unidas, 1200 · São Paulo - SP',
    branches: [
      { id: 'br-1', documentNumber: '11222333000262', name: 'Filial SP', socialName: null },
      { id: 'br-2', documentNumber: '11222333000343', name: 'Filial RJ', socialName: null },
    ],
    selectedBranchId: null,
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('marca uma filial e limpa a anterior (RN-102)', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.setBranch('br-1')
    expect(store.selectedBranchId).toBe('br-1')
    store.setBranch('br-2')
    expect(store.selectedBranchId).toBe('br-2')
    expect(store.policyHolder?.selectedBranchId).toBe('br-2')
  })

  it('desmarcar a filial volta o estabelecimento para a matriz (RN-102)', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.setBranch('br-1')
    store.clearBranch()
    expect(store.selectedBranchId).toBeNull()
  })

  it('trocar o tomador limpa a filial marcada (RN-102)', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.setBranch('br-1')
    // Novo tomador — objeto novo, sem filial marcada (é assim que a etapa 1 constrói ao selecionar).
    store.setPolicyHolder({ ...HOLDER, id: 'ph-2', name: 'Outro Tomador LTDA' })
    expect(store.selectedBranchId).toBeNull()
  })

  it('a filial entra na assinatura de recálculo (RN-051)', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.risk.modalityId = 'm1'
    store.risk.insuredAmount = 1000
    store.markQuotationsGenerated()
    expect(store.signatureChanged).toBe(false)
    store.setBranch('br-1')
    expect(store.signatureChanged).toBe(true)
  })

  it('retomar um rascunho com filial já persistida nasce marcada (RN-102)', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder({ ...HOLDER, selectedBranchId: 'br-2' })
    expect(store.selectedBranchId).toBe('br-2')
  })

  it('reset limpa a filial marcada e a lista de filiais', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.setBranch('br-1')
    store.reset()
    expect(store.policyHolder).toBeNull()
    expect(store.selectedBranchId).toBeNull()
    expect(store.branches).toEqual([])
  })

  it('o resumo mostra o CNPJ da matriz sem marcação e o da filial quando marcada', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    let w = await mountSuspended(SummarySidebar)
    expect(w.text()).toContain(formatCnpj(HOLDER.documentNumber))
    // O rótulo é fixo nos dois estados: no contexto da oferta o estabelecimento cotado é o
    // tomador, então "CNPJ do tomador" não muda com o tipo da empresa. Só o VALOR troca (RN-102).
    expect(w.text()).toContain('CNPJ do tomador')
    expect(w.text()).not.toContain('CNPJ da filial')

    store.setBranch('br-1')
    w = await mountSuspended(SummarySidebar)
    expect(w.text()).toContain(formatCnpj('11222333000262'))
    expect(w.text()).not.toContain(formatCnpj(HOLDER.documentNumber))
    expect(w.text()).toContain('CNPJ do tomador')
    expect(w.text()).not.toContain('CNPJ da filial')
  })

  it('a etapa 1 lista as filiais com marcação exclusiva; marcar uma desmarca a outra', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    const w = await mountSuspended(Step1PolicyHolder)
    const checkboxes = w.findAllComponents({ name: 'VCheckbox' })
    expect(checkboxes.length).toBe(2)

    await checkboxes[0]!.find('input').setValue(true)
    expect(store.selectedBranchId).toBe('br-1')

    await checkboxes[1]!.find('input').setValue(true)
    expect(store.selectedBranchId).toBe('br-2')
  })

  it('desmarcar o checkbox da filial volta o estabelecimento para a matriz', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER)
    store.setBranch('br-1')
    const w = await mountSuspended(Step1PolicyHolder)
    const checkboxes = w.findAllComponents({ name: 'VCheckbox' })
    await checkboxes[0]!.find('input').setValue(false)
    expect(store.selectedBranchId).toBeNull()
  })
})

describe('Etapa 1 — select() nasce marcada/desmarcada conforme preSelectedBranchId (RN-102)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  /** Busca e seleciona o único item da lista de resultados — caminho real (search → select()),
   * não a store direto: é o único jeito de exercitar `select()` de verdade (os testes de RN-102
   * acima montam o tomador via `setPolicyHolder`, que nunca passa por `select()`). */
  async function searchAndSelectFirstResult(w: Awaited<ReturnType<typeof mountSuspended>>, term: string) {
    await w.find('input').setValue(term)
    await w.find('form').trigger('submit')
    // Item 3: com um único resultado, `search()` chama `select()` automaticamente (sem clique na
    // lista). Espera a seleção refletir na store em vez de contar ticks: o `$api` tem interceptors
    // (`onRequest` encaminha o cookie no SSR, `onResponseError` trata 401 — plugins/api.ts), então a
    // resposta chega alguns microtasks depois do submit.
    await vi.waitFor(() => expect(useQuotationGroupWizardStore().policyHolder).not.toBeNull())
    await flushPromises()
  }

  it('CNPJ de Filial na busca: select() nasce com a Filial marcada (RN-102, "born marked")', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', {
      method: 'GET',
      once: true,
      handler: () => ({
        items: [{
          id: 'ph-born',
          documentNumber: '12345678000190',
          name: 'Construtora Aurora Engenharia LTDA',
          socialName: null,
          type: 'PJ',
          isPrivateSector: null,
          roles: ['PolicyHolder'],
          mainAddress: null,
          preSelectedBranchId: 'br-1',
          preSelectedBranchDocumentNumber: '11222333000262',
        }],
        notice: null,
      }),
    })
    registerEndpoint('/api/policy-holders/ph-born/branches', {
      method: 'GET',
      once: true,
      handler: () => ({
        branches: [{ id: 'br-1', documentNumber: '11222333000262', name: 'Filial SP', socialName: null }],
      }),
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await searchAndSelectFirstResult(w, '11222333000262')

    expect(store.policyHolder?.id).toBe('ph-born')
    // `select()` já marca a Filial de forma síncrona a partir de `preSelectedBranchId` do item de
    // busca — não depende do `loadBranches` (GET) em segundo plano ter terminado.
    expect(store.selectedBranchId).toBe('br-1')
  })

  it('busca sem preSelectedBranchId: select() abre a lista de Filiais desmarcada (RN-102)', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', {
      method: 'GET',
      once: true,
      handler: () => ({
        items: [{
          id: 'ph-unmarked',
          documentNumber: '98765432000110',
          name: 'Outra Construtora LTDA',
          socialName: null,
          type: 'PJ',
          isPrivateSector: null,
          roles: ['PolicyHolder'],
          mainAddress: null,
        }],
        notice: null,
      }),
    })
    registerEndpoint('/api/policy-holders/ph-unmarked/branches', {
      method: 'GET',
      once: true,
      handler: () => ({
        branches: [{ id: 'br-9', documentNumber: '11222333000262', name: 'Filial SP', socialName: null }],
      }),
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await searchAndSelectFirstResult(w, 'Outra Construtora')

    expect(store.policyHolder?.id).toBe('ph-unmarked')
    expect(store.selectedBranchId).toBeNull()
    // Drena o `loadBranches` em segundo plano (GET) antes de sair — evita que a resposta chegue
    // atrasada e vaze efeito colateral para o próximo teste (mesmo singleton do Pinia no arquivo).
    await vi.waitFor(() => expect(store.branches.map(b => b.id)).toContain('br-9'))
  })

  it('GET de Filiais falha com uma Filial pré-selecionada: a marcação nunca fica invisível nem sem como desmarcar (revisão final, Finding 2)', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', {
      method: 'GET',
      once: true,
      handler: () => ({
        items: [{
          id: 'ph-fail',
          documentNumber: '12345678000190',
          name: 'Construtora Aurora Engenharia LTDA',
          socialName: null,
          type: 'PJ',
          isPrivateSector: null,
          roles: ['PolicyHolder'],
          mainAddress: null,
          preSelectedBranchId: 'br-1',
          preSelectedBranchDocumentNumber: '11222333000262',
        }],
        notice: null,
      }),
    })
    registerEndpoint('/api/policy-holders/ph-fail/branches', {
      method: 'GET',
      once: true,
      handler: () => {
        throw createError({ statusCode: 500, statusMessage: 'Erro interno simulado' })
      },
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await searchAndSelectFirstResult(w, '11222333000262')

    // `select()` já marcou br-1 de forma síncrona (RN-102, "born marked"); o GET que traria a lista
    // completa falhou em seguida — a marcação não pode ter sido apagada nem ter ficado sem
    // checkbox pra vê-la/desmarcá-la, e a falha não pode ter sido engolida silenciosamente.
    await vi.waitFor(() => {
      expect(w.findAllComponents({ name: 'VAlert' }).some(a => a.classes().includes('si-alert--error'))).toBe(true)
    })
    expect(store.selectedBranchId).toBe('br-1')

    const checkboxes = w.findAllComponents({ name: 'VCheckbox' })
    expect(checkboxes).toHaveLength(1)
    expect(checkboxes[0]!.props('modelValue')).toBe(true)

    // O corretor consegue desmarcar o que seria enviado ao servidor mesmo com a listagem quebrada.
    await checkboxes[0]!.find('input').setValue(false)
    expect(store.selectedBranchId).toBeNull()
  })
})

describe('Etapa 1 — seleção do tomador (item 3: auto-select, lista e limpar)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  const TWO_RESULTS = {
    items: [
      { id: 'ph-a', documentNumber: '78016003000100', name: 'A Yoshii Engenharia e Construcoes LTDA', socialName: null, type: 'PJ', isPrivateSector: null, roles: ['PolicyHolder'], mainAddress: null },
      { id: 'ph-b', documentNumber: '01294872000172', name: 'Pilao Engenharia e Construcoes LTDA', socialName: null, type: 'PJ', isPrivateSector: null, roles: ['PolicyHolder'], mainAddress: null },
    ],
    notice: null,
  }

  it('2+ resultados: NÃO auto-seleciona — a lista aparece para o corretor escolher', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => TWO_RESULTS })
    registerEndpoint('/api/policy-holders/ph-b/branches', { method: 'GET', once: true, handler: () => ({ branches: [] }) })

    const w = await mountSuspended(Step1PolicyHolder)
    await w.find('input').setValue('constru')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(2))

    // Com mais de um resultado a seleção é sempre do corretor — nada é escolhido sozinho.
    expect(store.policyHolder).toBeNull()

    await w.findAllComponents({ name: 'SiListItem' })[1]!.trigger('click')
    await flushPromises()
    expect(store.policyHolder?.id).toBe('ph-b')
  })

  it('limpar o campo de busca recolhe os resultados abaixo', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => TWO_RESULTS })

    const w = await mountSuspended(Step1PolicyHolder)
    await w.find('input').setValue('constru')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(2))

    await w.find('input').setValue('')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(0))
    // Não havia tomador selecionado: limpar não deixa nada pendurado abaixo.
    expect(store.policyHolder).toBeNull()
  })
})

describe('Etapa 1 — addBranch() e seus três desfechos (Task 9/10, RN-102)', () => {
  const HOLDER_FOR_MODAL = {
    id: 'ph-modal',
    name: 'Empresa Cedro LTDA',
    documentNumber: '12345678000190',
    mainAddress: null,
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  /** Abre o modal "Adicionar filial", preenche o CNPJ e clica no botão de submissão do modal —
   * distinto do botão homônimo que abre o modal (mesmo texto, elemento diferente: VDialog
   * teleporta o conteúdo para fora da árvore DOM do wrapper, então localizamos por componente,
   * não por seletor DOM, e desambiguamos comparando o elemento). */
  async function openFillAndSubmitBranchModal(w: Awaited<ReturnType<typeof mountSuspended>>, cnpj: string) {
    const openBtn = w.findAllComponents({ name: 'VBtn' }).find(b => b.text().includes('Adicionar filial'))
    await openBtn!.trigger('click')
    const cnpjField = w.findAllComponents({ name: 'VTextField' }).at(-1)
    await cnpjField!.find('input').setValue(cnpj)
    const submitBtn = w.findAllComponents({ name: 'VBtn' })
      .find(b => b.text().includes('Adicionar filial') && b.element !== openBtn!.element)
    await submitBtn!.trigger('click')
    await flushPromises()
  }

  it('branchId presente: recarrega as filiais, marca a recém-criada e fecha o modal', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER_FOR_MODAL)
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'POST',
      once: true,
      handler: () => ({ headquartersId: HOLDER_FOR_MODAL.id, branchId: 'br-new', notice: null }),
    })
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'GET',
      once: true,
      handler: () => ({
        branches: [{ id: 'br-new', documentNumber: '11222333000262', name: 'Filial Nova', socialName: null }],
      }),
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await openFillAndSubmitBranchModal(w, '11222333000262')

    // Caminho feliz encadeia DOIS fetches (POST cria, depois GET recarrega) dentro do mesmo
    // `addBranch()` — um único `flushPromises()` no helper pode não drenar as duas rodadas de
    // microtasks; `vi.waitFor` espera até o encadeamento assentar, sem acoplar no nº de hops.
    await vi.waitFor(() => expect(store.selectedBranchId).toBe('br-new'))
    expect(store.branches.map(b => b.id)).toContain('br-new')
  })

  it('branchId nulo + notice: Birô não achou o CNPJ — mostra o aviso (info), modal continua aberto, matriz continua usável', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER_FOR_MODAL)
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'POST',
      once: true,
      handler: () => ({ headquartersId: HOLDER_FOR_MODAL.id, branchId: null, notice: 'CNPJ não encontrado no Birô.' }),
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await openFillAndSubmitBranchModal(w, '99999999000199')

    const infoAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--info'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(infoAlert.text()).toContain('CNPJ não encontrado no Birô.')
    // Não é erro: nenhuma marcação muda, a matriz segue sendo o estabelecimento, e o modal
    // permanece aberto. Checar por um VTextField qualquer não provaria nada — a busca (SEMPRE
    // visível, fora do modal) já é um; o que discrimina é o `modelValue` da própria SiDialog "Adicionar
    // filial" (a segunda no template — a primeira é a de "Limites e taxas" — ambas estáticas, não
    // v-for), que só é `true` enquanto o modal segue aberto.
    expect(store.selectedBranchId).toBeNull()
    expect(store.policyHolder?.id).toBe(HOLDER_FOR_MODAL.id)
    const branchDialog = w.findAllComponents({ name: 'SiDialog' }).at(1)!
    expect(branchDialog.props('modelValue')).toBe(true)
  })

  it('falha de rede (exceção): mostra o aviso de erro, distinto do notice do Birô', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER_FOR_MODAL)
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'POST',
      once: true,
      // `createError` (em vez de `throw new Error`) produz um H3Error já "reconhecido": o handler
      // ainda falha e o cliente ainda recebe 500 (o composable ainda lança, cai no catch de erro de
      // rede), mas o h3 não marca `unhandled: true` nem loga "[h3] [unhandled]" no stderr — barulho
      // que não tem nada a ver com o que este teste prova.
      handler: () => {
        throw createError({ statusCode: 500, statusMessage: 'Erro interno simulado' })
      },
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await openFillAndSubmitBranchModal(w, '11222333000262')

    const errorAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--error'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(errorAlert.text()).toContain('Não foi possível registrar a filial.')
    expect(store.selectedBranchId).toBeNull()
  })

  it('422 com detail (RN-101): mostra o motivo do backend em vez da mensagem genérica', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER_FOR_MODAL)
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'POST',
      once: true,
      // Reproduz o contrato do BFF (`proxyBackend`): na via de erro ele NÃO lança — define o status
      // original do backend via `setResponseStatus` e devolve o corpo (ProblemDetails) tal como veio,
      // então `detail` chega intacto na raiz de `err.data` do cliente (sem o envelope `{data: ...}`
      // que `createError`/`sendError` do h3 produziriam).
      handler: (event) => {
        setResponseStatus(event, 422)
        return {
          title: 'CNPJ inválido para Filial',
          status: 422,
          detail: 'O CNPJ informado pertence a uma raiz diferente da do tomador.',
        }
      },
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await openFillAndSubmitBranchModal(w, '99888777000199')

    const errorAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--error'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(errorAlert.text()).toContain('O CNPJ informado pertence a uma raiz diferente da do tomador.')
    expect(store.selectedBranchId).toBeNull()
  })

  it('422 sem detail no corpo: cai na mensagem genérica (RN-101, corpo sem o campo esperado)', async () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder(HOLDER_FOR_MODAL)
    registerEndpoint(`/api/policy-holders/${HOLDER_FOR_MODAL.id}/branches`, {
      method: 'POST',
      once: true,
      handler: (event) => {
        setResponseStatus(event, 422)
        return { title: 'Unprocessable Entity', status: 422 }
      },
    })

    const w = await mountSuspended(Step1PolicyHolder)
    await openFillAndSubmitBranchModal(w, '99888777000199')

    const errorAlert = await vi.waitFor(() => {
      const alert = w.findAllComponents({ name: 'VAlert' }).find(a => a.classes().includes('si-alert--error'))
      expect(alert).toBeTruthy()
      return alert!
    })
    expect(errorAlert.text()).toContain('Não foi possível registrar a filial.')
    expect(store.selectedBranchId).toBeNull()
  })
})

describe('Etapa 3 — Dados de risco (exec-plan 0015, incremento 3)', () => {
  type WizardStore = ReturnType<typeof useQuotationGroupWizardStore>

  function fillRisk(store: WizardStore): void {
    store.risk.modalityId = 'mod-1'
    store.risk.modalityName = 'Executante Construtor'
    store.risk.insuredAmount = 100000
    store.risk.startDate = '2026-08-01'
    store.risk.endDate = '2026-12-01'
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('validateCurrentStep exige modalidade, IS e vigência no passo de risco', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    store.goNext()
    store.goNext()
    expect(store.currentStep).toBe(2)
    expect(store.validateCurrentStep()).toContain('modalidade')
    fillRisk(store)
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa os dados de risco', () => {
    const store = useQuotationGroupWizardStore()
    fillRisk(store)
    store.reset()
    expect(store.risk.modalityId).toBeNull()
    expect(store.risk.insuredAmount).toBeNull()
  })

  it('o resumo mostra modalidade, IS e vigência', async () => {
    const store = useQuotationGroupWizardStore()
    fillRisk(store)
    const w = await mountSuspended(SummarySidebar)
    const text = w.text()
    expect(text).toContain('Executante Construtor')
    expect(text).toContain('R$')
    expect(text).toContain('2026')
  })
})

describe('Etapa 4 — Cotações (exec-plan 0013, RN-056..059)', () => {
  const QUOTE = makeQuote()

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('validateCurrentStep exige cotação selecionada no passo de cotações', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    for (let i = 0; i < 3; i++) store.goNext()
    expect(store.currentStep).toBe(3)
    expect(store.validateCurrentStep()).toContain('cotação')
    store.setSelectedQuotation(QUOTE)
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa a cotação selecionada', () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(QUOTE)
    store.reset()
    expect(store.selectedQuotation).toBeNull()
  })

  it('o resumo mostra a cotação selecionada', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(QUOTE)
    const w = await mountSuspended(SummarySidebar)
    expect(w.text()).toContain('Newe Seguros')
  })

  it('a etapa 4 monta o painel de cotações', async () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    store.setQuotationGroupId('qg-1')
    store.setBrokerageId('brk-1')
    const w = await mountSuspended(Step4Quotations)
    expect(w.find('.si-qg-step4').exists()).toBe(true)
  })

})

/**
 * O Escopo ativo é do servidor (RN-064): a etapa 4 precisa dele para resolver as Habilitações do
 * fan-out. O contexto do acesso é carregado uma vez por sessão de navegação, então os três cenários
 * abaixo se distinguem pelo que o SERVIDOR responde — não pelo que está no cache do cliente.
 */
describe('RN-064 Corretora ativa na etapa 4 de cotações', () => {
  const CONTEXT_BASE = {
    id: 'usr-1',
    name: 'Corretor',
    email: 'corretor@teste.com',
    status: 'Active',
    systemProfileName: 'BrokerageAdministrator',
    activePolicyHolderId: null,
    policyHolders: [],
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  function mountStep4WithSavedGroup() {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    store.setQuotationGroupId('qg-1')
    return store
  }

  it('RN-064: contexto em cache sem Corretora, servidor com — reconsulta e adota a do servidor', async () => {
    // Vínculo criado DEPOIS do login: o cache do cliente não tem Corretora, mas o servidor já tem.
    // Antes de bloquear o corretor, a etapa reconsulta o próprio acesso — sem isso ele fica travado
    // sem saída visível na tela, com a Corretora ativa já resolvida do outro lado.
    registerEndpoint('/api/me', {
      method: 'GET',
      handler: () => ({
        ...CONTEXT_BASE,
        activeBrokerageId: 'brk-9',
        brokerages: [{
          id: 'brk-9',
          documentNumber: '10864690000180',
          name: 'CORRETORA ATIVA',
          profileName: 'BrokerageAdministrator',
          isActive: true,
        }],
      }),
    })

    const store = mountStep4WithSavedGroup()
    const w = await mountSuspended(Step4Quotations)
    // A reconsulta é uma ida ao servidor: espera o efeito dela, não só o tick do mount.
    await vi.waitFor(() => expect(store.brokerageId).toBe('brk-9'))
    await flushPromises()

    expect(w.text()).not.toContain('Selecione uma corretora ativa para cotar')
  })

  it('RN-064: servidor também sem Corretora ativa — orienta a selecionar, não cota às cegas', async () => {
    // Acesso legítimo, mas nenhum Escopo de Corretora ativo: sem ele não há Habilitação a resolver.
    registerEndpoint('/api/me', {
      method: 'GET',
      handler: () => ({ ...CONTEXT_BASE, activeBrokerageId: null, brokerages: [] }),
    })

    const store = mountStep4WithSavedGroup()
    const w = await mountSuspended(Step4Quotations)
    await vi.waitFor(() => expect(w.text()).toContain('Selecione uma corretora ativa para cotar'))
    expect(store.brokerageId).toBeNull()
  })

  it('RN-064: consulta do acesso falha — avisa a falha em vez de culpar a corretora', async () => {
    // `loadContext` engole o erro e zera o contexto. Sem contexto nenhum o problema é a consulta, não
    // a ausência de Corretora: mandar "selecione uma corretora" faria o corretor caçar erro que não é dele.
    registerEndpoint('/api/me', {
      method: 'GET',
      handler: () => {
        throw createError({ statusCode: 500, statusMessage: 'contexto indisponível' })
      },
    })

    mountStep4WithSavedGroup()
    const w = await mountSuspended(Step4Quotations)
    await vi.waitFor(() => expect(w.text()).toContain('Não foi possível confirmar sua corretora ativa'))
    expect(w.text()).not.toContain('Selecione uma corretora ativa para cotar')
  })
})

describe('Etapa 4b — Minuta e cláusulas (RN-062/RN-063)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('buildObjetoTemplate inclui só as tags da seguradora', () => {
    const template = buildObjetoTemplate(['objeto', 'edital'])
    expect(template).toContain('{objeto}')
    expect(template).toContain('{edital}')
    expect(template).not.toContain('{orgao}')
  })

  it('parseTemplate separa texto puro de tokens', () => {
    const segments = parseTemplate('Reter {percRetencao} do valor.')
    expect(segments.some(s => s.tag === 'percRetencao')).toBe(true)
    expect(segments.some(s => s.tag === null && s.text.includes('Reter'))).toBe(true)
  })

  it('o bloco de minuta monta para a cotação selecionada', async () => {
    const store = useQuotationGroupWizardStore()
    store.setQuotationGroupId('qg-1')
    store.setSelectedQuotation(makeQuote())
    const w = await mountSuspended(MinutaClauses)
    expect(w.find('.si-minuta').exists()).toBe(true)
  })

  it('reset limpa minuta e cláusulas', () => {
    const store = useQuotationGroupWizardStore()
    store.minuta.objeto = 'obra X'
    store.clauses['10'] = true
    store.reset()
    expect(store.minuta).toEqual({})
    expect(store.clauses).toEqual({})
  })
})

describe('Etapa 5 — Emissão (exec-plan 0015, incremento 5)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  // RN-505: o número do contrato saiu da validação (é Tag da minuta, RN-502); o que a etapa exige é a
  // forma de pagamento, escolhida entre as opções que a Seguradora informou na Cotação.
  it('validateCurrentStep exige a forma de pagamento na emissão', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    for (let i = 0; i < 4; i++) store.goNext()
    expect(store.currentStep).toBe(4)
    expect(store.validateCurrentStep()).toContain('forma de pagamento')
    store.issuance.parcelas = 3
    store.issuance.vencimento = 30
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa os dados de emissão', () => {
    const store = useQuotationGroupWizardStore()
    store.issuance.taxa = '2,5'
    store.issuanceState = 'requested'
    store.termOpen = true
    store.reset()
    expect(store.issuance.taxa).toBe('')
    expect(store.issuanceState).toBe('form')
    expect(store.termOpen).toBe(false)
  })

  it('a etapa 5 renderiza prêmio/comissão e a forma de pagamento', async () => {
    useQuotationGroupWizardStore().startOffer()
    const w = await mountSuspended(Step5Issuance)
    const text = w.text()
    expect(text).toContain('Prêmio e comissão')
    expect(text).toContain('Forma de pagamento')
    expect(text).not.toContain('Número do contrato')
  })

  // RN-508/RN-514: o desfecho é "Emissão solicitada" — a plataforma não afirma apólice emitida.
  it('no desfecho, mostra "Emissão solicitada" com o número da proposta', async () => {
    const store = useQuotationGroupWizardStore()
    store.setIssuanceRequested({ policyExternalId: 'AP-EXT-1', proposalNumber: 'PROP-77' })
    const w = await mountSuspended(Step5Issuance)
    expect(w.text()).toContain('Emissão solicitada')
    expect(w.text()).toContain('PROP-77')
    expect(w.text()).not.toContain('Apólice emitida')
  })
})

describe('Etapa 2 — Dados do segurado (exec-plan 0015, incremento 6)', () => {
  const insured = { id: 'i1', name: 'Segurado Aurora LTDA', documentNumber: '98765432000110', socialName: 'Aurora', mainAddress: 'Rua X, 10 - São Paulo/SP' }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('usePersons busca por termo e papel Insured via BFF', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ items: [], notice: null })
    const { searchPersons } = usePersons(fetchMock as unknown as typeof $fetch)
    await searchPersons({ term: 'aurora', role: 'Insured' })
    expect(fetchMock).toHaveBeenCalledWith('/api/persons', {
      method: 'GET',
      query: { term: 'aurora', role: 'Insured' },
    })
  })

  it('validateCurrentStep exige o segurado no passo 2', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    store.goNext()
    expect(store.currentStep).toBe(1)
    expect(store.validateCurrentStep()).toContain('segurado')
    store.setInsured(insured)
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa o segurado selecionado', () => {
    const store = useQuotationGroupWizardStore()
    store.setInsured(insured)
    store.reset()
    expect(store.insured).toBeNull()
  })

  it('a etapa 2 renderiza a busca de segurado', async () => {
    const w = await mountSuspended(Step2Insured)
    expect(w.text()).toContain('CNPJ ou razão social do segurado')
  })

  it('o resumo mostra o segurado selecionado', async () => {
    const store = useQuotationGroupWizardStore()
    store.setInsured(insured)
    const w = await mountSuspended(SummarySidebar)
    expect(w.text()).toContain('Segurado Aurora LTDA')
  })
})

describe('Etapa 2 — seleção do segurado (auto-select, lista e limpar)', () => {
  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  const ONE_INSURED = {
    items: [{ id: 'in-x', documentNumber: '33333333000133', name: 'Unica Servicos LTDA', socialName: null, type: 'PJ', isPrivateSector: null, roles: ['Insured'], mainAddress: null }],
    notice: null,
  }
  const TWO_INSURED = {
    items: [
      { id: 'in-a', documentNumber: '11111111000111', name: 'Aurora Servicos LTDA', socialName: null, type: 'PJ', isPrivateSector: null, roles: ['Insured'], mainAddress: null },
      { id: 'in-b', documentNumber: '22222222000122', name: 'Aurora Comercio LTDA', socialName: null, type: 'PJ', isPrivateSector: null, roles: ['Insured'], mainAddress: null },
    ],
    notice: null,
  }

  it('1 resultado: auto-seleciona o segurado sem clique', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => ONE_INSURED })

    const w = await mountSuspended(Step2Insured)
    await w.find('input').setValue('unica')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(store.insured).not.toBeNull())
    expect(store.insured?.id).toBe('in-x')
  })

  it('2+ resultados: NÃO auto-seleciona — a lista aparece para o corretor escolher', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => TWO_INSURED })

    const w = await mountSuspended(Step2Insured)
    await w.find('input').setValue('aurora')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(2))
    expect(store.insured).toBeNull()

    await w.findAllComponents({ name: 'SiListItem' })[1]!.trigger('click')
    await flushPromises()
    expect(store.insured?.id).toBe('in-b')
  })

  it('limpar o campo de busca recolhe os resultados', async () => {
    const store = useQuotationGroupWizardStore()
    registerEndpoint('/api/persons', { method: 'GET', once: true, handler: () => TWO_INSURED })

    const w = await mountSuspended(Step2Insured)
    await w.find('input').setValue('aurora')
    await w.find('form').trigger('submit')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(2))

    await w.find('input').setValue('')
    await vi.waitFor(() => expect(w.findAllComponents({ name: 'SiListItem' }).length).toBe(0))
    expect(store.insured).toBeNull()
  })
})

describe('Salvar QuotationGroup + recálculo inteligente (exec-plan 0015)', () => {
  const payload = {
    policyHolderId: 'p',
    branchId: null,
    insuredId: 'i',
    scope: { mode: 'all', insurerIds: [] },
    risk: { modalityId: 'm', insuredAmount: 1000, startDate: '2026-01-01', endDate: '2026-02-01', coverageMulta: false, coverageLabor: false },
  }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
  })

  it('RN-050/RN-051: POST cria (sem id) e PUT atualiza mantendo o mesmo id, mapeando escopo/risco', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ id: 'qg-1', status: 'Draft' })
      .mockResolvedValueOnce({ id: 'qg-1', status: 'Draft' })
    const { saveQuotationGroup } = useQuotationGroups(fetchMock as unknown as typeof $fetch)

    const created = await saveQuotationGroup(payload, null)
    expect(created.id).toBe('qg-1')
    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups', {
      method: 'POST',
      body: {
        policyHolderId: 'p',
        branchId: null,
        insuredId: 'i',
        // RN-503: sem escolha no passo 2, null pede ao servidor o principal (na criação) ou a
        // preservação da réplica já combinada (na atualização).
        insuredAddressId: null,
        modalityId: 'm',
        insuredAmount: 1000,
        coverageStartDate: '2026-01-01',
        coverageEndDate: '2026-02-01',
        scopeMode: 'All',
        insurerIds: [],
        includesPenaltyCoverage: false,
        includesLaborCoverage: false,
      },
    })

    const updated = await saveQuotationGroup(payload, created.id)
    expect(updated.id).toBe('qg-1')
    expect(fetchMock).toHaveBeenLastCalledWith('/api/quotation-groups/qg-1', {
      method: 'PUT',
      body: expect.objectContaining({ scopeMode: 'All', modalityId: 'm' }),
    })
  })

  it('signatureChanged: falso logo após gerar; verdadeiro quando um dado do motor muda', () => {
    const store = useQuotationGroupWizardStore()
    store.setPolicyHolder({ id: 'p', name: 'X', documentNumber: '1', mainAddress: null })
    store.risk.modalityId = 'm1'
    store.risk.insuredAmount = 1000
    store.markQuotationsGenerated()
    expect(store.signatureChanged).toBe(false)
    store.risk.insuredAmount = 2000
    expect(store.signatureChanged).toBe(true)
  })

  it('reset limpa cotações, assinatura e id do grupo', () => {
    const store = useQuotationGroupWizardStore()
    store.setQuotations({ available: [], unavailable: [], selectedQuotationId: null, pending: [] })
    store.markQuotationsGenerated()
    store.setQuotationGroupId('qg-1')
    store.reset()
    expect(store.quotations).toBeNull()
    expect(store.quotationGroupId).toBeNull()
    expect(store.signatureChanged).toBe(false)
  })
})
