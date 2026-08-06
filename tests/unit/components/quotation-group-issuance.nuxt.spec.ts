// @vitest-environment nuxt
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createError } from 'h3'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import type { Quotation } from '~/composables/useQuotations'
import Step5Issuance from '~/components/quotation-groups/Step5Issuance.vue'
import { useIssuance } from '~/composables/useIssuance'
import { useQuotationGroupWizardStore } from '~/stores/quotationGroupWizard'

/** Cotação Pronta para emissão, com as opções de pagamento que a Seguradora informou (RN-505). */
function makeReadyQuotation(over: Partial<Quotation> = {}): Quotation {
  return {
    id: 'q-ready',
    insurerId: 'ins-1',
    name: 'Sancor Seguros',
    logoUrl: null,
    premio: 412.5,
    comissao: 22,
    limite: null,
    status: 'auto',
    taxa: 1.8,
    tags: [],
    result: 'ReadyForEmission',
    analysisTrack: null,
    isFollowable: true,
    requiresCcg: false,
    ccgSigned: false,
    ccgMaxLimitWithoutNeed: null,
    installmentOptions: [{ number: 1, description: 'À vista', value: 412.5, hasInterest: false }],
    possibleGracePeriodsInDays: [0, 30],
    requiredDocuments: [],
    ...over,
  }
}

/**
 * RN-500..RN-514 — Passo 5 real: a emissão é solicitada ao servidor com o parcelamento e o vencimento
 * escolhidos entre as opções da Cotação e o aceite explícito do Termo; a taxa é ajustada pelo servidor
 * (a plataforma não calcula dinheiro, ADR-004) e o desfecho é "Emissão solicitada" — a plataforma não
 * afirma apólice emitida, porque não confirmou (RN-508/RN-514).
 */
describe('RN-500/RN-514 emissão real da apólice', () => {
  const ISSUANCE_RESPONSE = {
    policyId: 'a1b2c3d4-0000-7000-8000-000000000001',
    policyExternalId: 'AP-EXT-9',
    proposalNumber: 'PROP-77',
    requestedAt: '2026-08-03T18:00:00Z',
    quotationGroupStatus: 'EmissionRequested',
  }

  it('solicita a emissão no servidor com pagamento e aceite do termo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ISSUANCE_RESPONSE)
    const { requestIssuance } = useIssuance(fetchMock as unknown as typeof $fetch)

    const result = await requestIssuance({
      quotationGroupId: 'qg-1',
      installmentNumber: 3,
      gracePeriodInDays: 30,
      termAccepted: true,
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/qg-1/policy', {
      method: 'POST',
      body: { installmentNumber: 3, gracePeriodInDays: 30, termAccepted: true },
    })
    expect(result.proposalNumber).toBe('PROP-77')
    expect(result.quotationGroupStatus).toBe('EmissionRequested')
  })

  it('ajuste de taxa vai ao servidor e devolve os valores recalculados pela seguradora', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      premium: 450,
      tax: 2.5,
      commissionPercentage: 25,
      commissionValue: 112.5,
      installmentOptions: [{ number: 2, description: '2x', value: 225, hasInterest: false }],
      possibleGracePeriodsInDays: [0, 30],
    })
    const { updateTax } = useIssuance(fetchMock as unknown as typeof $fetch)

    const result = await updateTax({ quotationGroupId: 'qg-1', tax: 2.5 })

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/qg-1/quotations/selected-tax', {
      method: 'POST',
      body: { tax: 2.5 },
    })
    expect(result.premium).toBe(450)
    expect(result.commissionValue).toBe(112.5)
    expect(result.installmentOptions).toHaveLength(1)
  })

  it('busca o texto do termo vigente no servidor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      insurerId: 'ins-1',
      content: 'O tomador declara ter lido as condições.',
    })
    const { getInsurerTerm } = useIssuance(fetchMock as unknown as typeof $fetch)

    const term = await getInsurerTerm('qg-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/qg-1/insurer-term')
    expect(term.content).toContain('declara ter lido')
  })

  it('RN-505/RN-510: a cotação carrega as opções de pagamento e os documentos exigidos', () => {
    const store = useQuotationGroupWizardStore()

    store.setSelectedQuotation({
      id: 'q1',
      insurerId: 'ins-1',
      name: 'Seguradora X',
      logoUrl: null,
      premio: 300,
      comissao: 20,
      limite: null,
      status: 'auto',
      taxa: 1.5,
      tags: [],
      result: 'ReadyForEmission',
      analysisTrack: null,
      isFollowable: true,
      requiresCcg: false,
      ccgSigned: false,
      ccgMaxLimitWithoutNeed: null,
      installmentOptions: [{ number: 1, description: 'À vista', value: 300, hasInterest: false }],
      possibleGracePeriodsInDays: [0, 30],
      requiredDocuments: [{ name: 'Contrato social', description: null }],
    })

    expect(store.selectedQuotation?.installmentOptions).toHaveLength(1)
    expect(store.selectedQuotation?.possibleGracePeriodsInDays).toEqual([0, 30])
    expect(store.selectedQuotation?.requiredDocuments[0]?.name).toBe('Contrato social')
  })

  it('a store guarda o desfecho como emissão solicitada, com o número da proposta', () => {
    const store = useQuotationGroupWizardStore()

    store.setIssuanceRequested({ policyExternalId: 'AP-EXT-9', proposalNumber: 'PROP-77' })

    expect(store.issuanceState).toBe('requested')
    expect(store.issuedProposalNumber).toBe('PROP-77')
  })
})

/**
 * RN-501 — Contragarantia exigida sem assinatura é beco sem saída nesta fase: a tela avisa antes de o
 * corretor preencher o resto, em vez de deixá-lo bater no erro do servidor depois de aceitar o Termo.
 */
describe('RN-501 Contragarantia exigida bloqueia a emissão', () => {
  // A store é a do contexto Nuxt, compartilhada entre os testes: reset para nascer no formulário.
  beforeEach(() => useQuotationGroupWizardStore().reset())

  it('avisa quando a seguradora exige Contragarantia sem assinatura', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ requiresCcg: true, ccgSigned: false }))

    const w = await mountSuspended(Step5Issuance)

    expect(w.text()).toContain('Contragarantia')
  })

  it('não avisa quando a Contragarantia já está assinada', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ requiresCcg: true, ccgSigned: true }))

    const w = await mountSuspended(Step5Issuance)

    expect(w.text()).not.toContain('Emissão indisponível')
  })
})

/**
 * RN-506 — o aceite do Termo é ato explícito: sem ele o emitir não é liberado, e o texto exibido é o do
 * servidor (o mesmo que o aceite registra), nunca uma cópia guardada na tela.
 */
describe('RN-506 aceite do Termo é obrigatório para emitir', () => {
  beforeEach(() => useQuotationGroupWizardStore().reset())

  /** O diálogo do kit é teleportado para fora do wrapper — o botão é procurado no documento. */
  function emitirDoTermo(): HTMLButtonElement | undefined {
    return [...document.querySelectorAll('button')]
      .find(button => button.textContent?.includes('Emitir apólice')) as HTMLButtonElement | undefined
  }

  it('mantém "Emitir apólice" desabilitado enquanto o Termo não é aceito', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation())
    store.termAccepted = false
    store.termOpen = true

    await mountSuspended(Step5Issuance)
    await flushPromises()

    expect(emitirDoTermo()?.disabled).toBe(true)

    store.termAccepted = true
    await flushPromises()

    expect(emitirDoTermo()?.disabled).toBe(false)
  })
})

/**
 * RN-504 — a taxa que a etapa oferece para ajuste é a **vigente na Cotação escolhida**, que veio da
 * Seguradora. Campo vazio esconderia o valor que está valendo e obrigaria o corretor a redigitar de
 * memória o que a plataforma já sabe; e reenviar a taxa que já vale é chamada inútil à Seguradora.
 */
describe('RN-504 taxa vigente da cotação escolhida', () => {
  beforeEach(() => useQuotationGroupWizardStore().reset())

  function campoTaxa(wrapper: { findAll: (s: string) => { element: HTMLInputElement }[] }) {
    return wrapper.findAll('input')
      .map(input => input.element)
      .find(element => element.value === '0,36' || element.placeholder === '0,00')
  }

  it('RN-504: apresenta a taxa que veio da seguradora, não campo vazio', async () => {
    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ taxa: 0.36 }))

    const w = await mountSuspended(Step5Issuance)
    await flushPromises()

    expect(store.issuance.taxa).toBe('0,36')
    expect(campoTaxa(w)?.value).toBe('0,36')

    // Trocar a Cotação escolhida leva o campo junto — prova que o valor acompanha a Cotação, em vez
    // de ter sido escrito uma vez na montagem.
    store.setSelectedQuotation(makeReadyQuotation({ id: 'q-outra', taxa: 2.75 }))
    await vi.waitFor(() => expect(store.issuance.taxa).toBe('2,75'))
  })

  it('RN-504: a tela submete e reflete o que o servidor devolveu, sem decidir por conta própria', async () => {
    // Quem decide se a taxa mudou é o servidor (RN-504 vale no UpdateQuotationTaxUseCase): a tela não
    // pode comparar taxas e engolir a chamada, senão a regra passa a viver em dois lugares.
    let chamadas = 0
    registerEndpoint('/api/quotation-groups/qg-1/quotations/selected-tax', {
      method: 'POST',
      handler: () => {
        chamadas += 1
        return {
          premium: 412.5,
          tax: 1.8,
          commissionPercentage: 22,
          commissionValue: 90.75,
          installmentOptions: [{ number: 1, description: 'À vista', value: 412.5, hasInterest: false }],
          possibleGracePeriodsInDays: [0],
        }
      },
    })

    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ taxa: 1.8 }))
    store.setQuotationGroupId('qg-1')

    const w = await mountSuspended(Step5Issuance)
    await flushPromises()

    // Mesma taxa que está no campo: a tela não filtra — o servidor responde com a Cotação como está.
    const recalcular = w.findAll('button').find(button => button.text().includes('Recalcular'))
    await recalcular?.trigger('click')
    await vi.waitFor(() => expect(chamadas).toBe(1))
    expect(store.selectedQuotation?.taxa).toBe(1.8)
  })

  it('RN-504: taxa não positiva é barrada como formato, sem ir ao servidor', async () => {
    // A RN autoriza a plataforma a validar APENAS o formato ("numérico maior que zero") — isso não é
    // decidir sobre o valor da taxa, é impedir um envio que não tem sentido.
    let chamadas = 0
    registerEndpoint('/api/quotation-groups/qg-formato/quotations/selected-tax', {
      method: 'POST',
      handler: () => {
        chamadas += 1
        return { premium: 1, tax: 1, commissionPercentage: 1, commissionValue: 1, installmentOptions: [], possibleGracePeriodsInDays: [] }
      },
    })

    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ taxa: 1.8 }))
    store.setQuotationGroupId('qg-formato')

    const w = await mountSuspended(Step5Issuance)
    await flushPromises()

    store.issuance.taxa = '0'
    const recalcular = w.findAll('button').find(button => button.text().includes('Recalcular'))
    await recalcular?.trigger('click')
    await flushPromises()

    expect(chamadas).toBe(0)
    expect(w.text()).toContain('Informe uma taxa maior que zero')
  })

  it('RN-505: recálculo bem-sucedido descarta a escolha de pagamento que deixou de existir', async () => {
    // A Seguradora devolve OUTRO conjunto de opções junto do novo cálculo: o parcelamento e o
    // vencimento escolhidos antes podem não existir mais, e escolha morta não pode seguir para a
    // emissão como se valesse.
    registerEndpoint('/api/quotation-groups/qg-505/quotations/selected-tax', {
      method: 'POST',
      handler: () => ({
        premium: 600,
        tax: 3.2,
        commissionPercentage: 25,
        commissionValue: 150,
        installmentOptions: [{ number: 2, description: '2x', value: 300, hasInterest: false }],
        possibleGracePeriodsInDays: [15],
      }),
    })

    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({
      taxa: 1.8,
      installmentOptions: [{ number: 1, description: 'À vista', value: 412.5, hasInterest: false }],
      possibleGracePeriodsInDays: [0, 30],
    }))
    store.setQuotationGroupId('qg-505')

    // Escolhas válidas ANTES do recálculo — nenhuma delas sobrevive ao novo conjunto.
    store.issuance.parcelas = 1
    store.issuance.vencimento = 30

    const w = await mountSuspended(Step5Issuance)
    await flushPromises()

    store.issuance.taxa = '3,2'
    const recalcular = w.findAll('button').find(button => button.text().includes('Recalcular'))
    await recalcular?.trigger('click')
    await vi.waitFor(() => expect(store.selectedQuotation?.premio).toBe(600))

    expect(store.issuance.parcelas).toBeNull()
    expect(store.issuance.vencimento).toBeNull()
    // O que a Seguradora devolveu passa a ser a única oferta possível.
    expect(store.selectedQuotation?.installmentOptions.map(option => option.number)).toEqual([2])
    expect(store.selectedQuotation?.possibleGracePeriodsInDays).toEqual([15])
  })

  it('RN-504 (caso limite): falha ao submeter preserva os valores anteriores e informa o corretor', async () => {
    registerEndpoint('/api/quotation-groups/qg-erro/quotations/selected-tax', {
      method: 'POST',
      handler: () => {
        throw createError({ statusCode: 502, statusMessage: 'seguradora indisponível' })
      },
    })

    const store = useQuotationGroupWizardStore()
    store.setSelectedQuotation(makeReadyQuotation({ taxa: 1.8, premio: 412.5, comissao: 22 }))
    store.setQuotationGroupId('qg-erro')

    const w = await mountSuspended(Step5Issuance)
    await flushPromises()

    store.issuance.taxa = '3,2'
    const recalcular = w.findAll('button').find(button => button.text().includes('Recalcular'))
    await recalcular?.trigger('click')
    await vi.waitFor(() => expect(w.text()).toContain('Não foi possível ajustar a taxa'))

    // O que valia continua valendo: nada de meio-caminho na tela quando a Seguradora não respondeu.
    expect(store.selectedQuotation?.taxa).toBe(1.8)
    expect(store.selectedQuotation?.premio).toBe(412.5)
    expect(store.selectedQuotation?.comissao).toBe(22)
  })
})
