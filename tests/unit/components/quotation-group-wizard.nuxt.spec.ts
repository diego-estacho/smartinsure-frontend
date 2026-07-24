// @vitest-environment nuxt
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Wizard from '~/components/quotation-groups/Wizard.vue'
import EntryStep from '~/components/quotation-groups/EntryStep.vue'
import SummarySidebar from '~/components/quotation-groups/SummarySidebar.vue'
import Step4Quotations from '~/components/quotation-groups/Step4Quotations.vue'
import MinutaClauses from '~/components/quotation-groups/MinutaClauses.vue'
import Step5Issuance from '~/components/quotation-groups/Step5Issuance.vue'
import Step2Insured from '~/components/quotation-groups/Step2Insured.vue'
import { useQuotations } from '~/composables/useQuotations'
import { useIssuance } from '~/composables/useIssuance'
import { usePersons } from '~/composables/usePersons'
import { useQuotationGroups } from '~/composables/useQuotationGroups'
import { buildObjetoTemplate, parseTemplate } from '~/lib/minuta'
import { useQuotationGroupWizardStore, WIZARD_STEPS } from '~/stores/quotationGroupWizard'

/** Força o desktop (>=1024) para o wizard nascer em 2 colunas com o SiStepper (não o compacto). */
function forceDesktopViewport() {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
  window.dispatchEvent(new Event('resize'))
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

describe('Etapa 4 — Cotações (exec-plan 0015, incremento 4)', () => {
  const QUOTE = { id: 'newe', name: 'Newe Seguros', premio: 300, comissao: 25, limite: 1_928_991, status: 'auto' as const, taxa: 0.42 }

  beforeEach(() => {
    useQuotationGroupWizardStore().reset()
    forceDesktopViewport()
  })

  it('useQuotations (mock) retorna as fixtures do handoff', async () => {
    const { fetchQuotations } = useQuotations()
    const result = await fetchQuotations({ delayMs: 0 })
    expect(result.available.length).toBe(3)
    expect(result.unavailable.length).toBe(4)
    expect(result.available[0]).toHaveProperty('premio')
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

  it('a etapa 4 exibe o estado de carregamento ("espera → lote") ao montar', async () => {
    useQuotationGroupWizardStore().startOffer()
    const w = await mountSuspended(Step4Quotations)
    expect(w.text()).toContain('Consultando seguradoras')
  })
})

describe('Etapa 4b — Minuta e cláusulas (exec-plan 0015)', () => {
  const withTags = { id: 'sancor', name: 'Sancor Seguros', premio: 250, comissao: 20, limite: 10_000_000, status: 'auto' as const, taxa: 0.36, tags: ['objeto', 'edital'] }
  const noTags = { id: 'newe', name: 'Newe Seguros', premio: 300, comissao: 25, limite: 1_928_991, status: 'auto' as const, taxa: 0.42, tags: [] }

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

  it('mostra as tags da minuta quando a seguradora exige, e as cláusulas (Dolo marcada por padrão)', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(withTags)
    const w = await mountSuspended(MinutaClauses)
    const text = w.text()
    expect(text).toContain('Tags da minuta')
    expect(text).toContain('Cláusulas particulares')
    expect(text).toContain('Dolo')
  })

  it('sem tags, o bloco de minuta não aparece (só cláusulas)', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(noTags)
    const w = await mountSuspended(MinutaClauses)
    expect(w.text()).not.toContain('Tags da minuta')
    expect(w.text()).toContain('Cláusulas particulares')
  })

  it('reset limpa minuta e cláusulas', () => {
    const store = useQuotationGroupWizardStore()
    store.minuta.objeto = 'obra X'
    store.clauses.dolo = false
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

  it('useIssuance (mock) retorna o identificador da apólice', async () => {
    const { issue } = useIssuance()
    const result = await issue({ delayMs: 0 })
    expect(result.policyId).toBeTruthy()
  })

  it('validateCurrentStep exige contrato e forma de pagamento na emissão', () => {
    const store = useQuotationGroupWizardStore()
    store.startOffer()
    for (let i = 0; i < 4; i++) store.goNext()
    expect(store.currentStep).toBe(4)
    expect(store.validateCurrentStep()).toContain('contrato')
    store.issuance.contrato = '2026/0481-SP'
    store.issuance.parcelas = '3'
    store.issuance.vencimento = '30'
    expect(store.validateCurrentStep()).toBeNull()
  })

  it('reset limpa os dados de emissão', () => {
    const store = useQuotationGroupWizardStore()
    store.issuance.contrato = 'X'
    store.issuanceState = 'success'
    store.termOpen = true
    store.reset()
    expect(store.issuance.contrato).toBe('')
    expect(store.issuanceState).toBe('form')
    expect(store.termOpen).toBe(false)
  })

  it('a etapa 5 renderiza o formulário (contrato + forma de pagamento)', async () => {
    useQuotationGroupWizardStore().startOffer()
    const w = await mountSuspended(Step5Issuance)
    const text = w.text()
    expect(text).toContain('Número do contrato')
    expect(text).toContain('Forma de pagamento')
  })

  it('no estado de sucesso, mostra "Apólice emitida"', async () => {
    const store = useQuotationGroupWizardStore()
    store.issuance.contrato = '2026/0481-SP'
    store.issuanceState = 'success'
    store.policyId = 'AP-1'
    const w = await mountSuspended(Step5Issuance)
    expect(w.text()).toContain('Apólice emitida')
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

describe('Salvar QuotationGroup + recálculo inteligente (exec-plan 0015)', () => {
  const payload = {
    policyHolderId: 'p',
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
        insuredId: 'i',
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
    store.setQuotations({ available: [], unavailable: [] })
    store.markQuotationsGenerated()
    store.setQuotationGroupId('qg-1')
    store.reset()
    expect(store.quotations).toBeNull()
    expect(store.quotationGroupId).toBeNull()
    expect(store.signatureChanged).toBe(false)
  })
})
