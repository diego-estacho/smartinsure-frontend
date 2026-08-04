// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { useIssuance } from '~/composables/useIssuance'
import { useQuotationGroupWizardStore } from '~/stores/quotationGroupWizard'

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
