import { afterEach, describe, expect, it, vi } from 'vitest'
import type { components } from '../../app/types/gen/api'
import { mapQuotations, useQuotations } from '../../app/composables/useQuotations'

type Item = components['schemas']['QuotationListItemResponse']
type ListResponse = components['schemas']['ListQuotationsResponse']

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

function item(over: Partial<Item>): Item {
  return {
    quotationId: 'q-1',
    insurerId: 'i-1',
    insurerName: 'Seguradora X',
    insurerLogoUrl: null,
    processingStatus: 'Obtained',
    result: null,
    analysisTrack: null,
    isFollowable: false,
    premium: null,
    commissionPercentage: null,
    commissionValue: null,
    tax: null,
    availableLimit: null,
    requiresCcg: false,
    ccgMaxLimitWithoutNeed: null,
    ccgSigned: false,
    reasons: [],
    ...over,
  }
}

function list(quotations: Item[], selectedQuotationId: string | null = null): ListResponse {
  return { quotationGroupId: 'g-1', selectedQuotationId, quotations }
}

describe('RN-058 — mapeamento do leque de Cotações (ACL → tela)', () => {
  it('classifica ReadyForEmission como disponível "auto" com prêmio/CCG', () => {
    const result = mapQuotations(list([
      item({ quotationId: 'a', result: 'ReadyForEmission', isFollowable: true, premium: 300, commissionPercentage: 25, availableLimit: 1000000, requiresCcg: true }),
    ]))

    expect(result.available).toHaveLength(1)
    expect(result.available[0]!.status).toBe('auto')
    expect(result.available[0]!.premio).toBe(300)
    expect(result.available[0]!.isFollowable).toBe(true)
    expect(result.available[0]!.requiresCcg).toBe(true)
    expect(result.unavailable).toHaveLength(0)
    expect(result.pending).toHaveLength(0)
  })

  it('classifica Analysis como "analise" com esteira específica', () => {
    const result = mapQuotations(list([
      item({ quotationId: 'b', result: 'Analysis', analysisTrack: 'Underwriting', isFollowable: true }),
    ]))

    expect(result.available[0]!.status).toBe('analise')
    expect(result.available[0]!.analysisTrack).toBe('Underwriting')
  })

  it('manda Unavailable/Unrecognized/Failed para indisponíveis com motivos', () => {
    const result = mapQuotations(list([
      item({ quotationId: 'c', result: 'Unavailable', reasons: ['Sem capacidade para o tomador.'] }),
      item({ quotationId: 'd', result: 'Unrecognized', reasons: [] }),
      item({ quotationId: 'e', processingStatus: 'Failed', result: null, reasons: ['Falha na integração: timeout'] }),
    ]))

    expect(result.available).toHaveLength(0)
    expect(result.unavailable).toHaveLength(3)
    expect(result.unavailable[0]!.reason).toBe('Sem capacidade para o tomador.')
    expect(result.unavailable[1]!.reason).toContain('não reconhecido')
    expect(result.unavailable[2]!.reasons).toContain('Falha na integração: timeout')
  })

  it('expõe as Requested como pendentes (skeletons nomeados) com nome/logo', () => {
    const result = mapQuotations(list([
      item({ quotationId: 'f', insurerName: 'Seguradora Y', processingStatus: 'Requested', result: null }),
      item({ quotationId: 'g', result: 'ReadyForEmission', isFollowable: true, premium: 200 }),
    ]))

    expect(result.pending).toHaveLength(1)
    expect(result.pending[0]!.name).toBe('Seguradora Y')
    expect(result.available).toHaveLength(1)
  })

  it('propaga a Cotação escolhida do Grupo (selectedQuotationId)', () => {
    const result = mapQuotations(list([item({ quotationId: 'h', result: 'ReadyForEmission', isFollowable: true })], 'h'))
    expect(result.selectedQuotationId).toBe('h')
  })
})

describe('RN-056/057/059 — composable useQuotations (BFF)', () => {
  it('dispara o fan-out via POST com a Corretora no corpo', async () => {
    fetchMock.mockResolvedValueOnce({ quotationGroupId: 'g-1', requestedCount: 3 })

    const { runQuotations } = useQuotations(api)
    await runQuotations('g-1', 'brk-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/g-1/quotations', {
      method: 'POST',
      body: { brokerageId: 'brk-1' },
    })
  })

  it('lê o leque via GET e devolve o resultado mapeado', async () => {
    fetchMock.mockResolvedValueOnce(list([
      item({ quotationId: 'a', result: 'ReadyForEmission', isFollowable: true, premium: 300 }),
    ]))

    const { listQuotations } = useQuotations(api)
    const result = await listQuotations('g-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/g-1/quotations', { method: 'GET' })
    expect(result.available[0]!.premio).toBe(300)
  })

  it('marca a Cotação escolhida via POST select', async () => {
    fetchMock.mockResolvedValueOnce({ quotationGroupId: 'g-1', selectedQuotationId: 'q-9' })

    const { selectQuotation } = useQuotations(api)
    await selectQuotation('g-1', 'q-9')

    expect(fetchMock).toHaveBeenCalledWith('/api/quotation-groups/g-1/quotations/q-9/select', { method: 'POST' })
  })
})
