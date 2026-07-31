import { describe, expect, it, vi } from 'vitest'
import { useQuotationBook } from '../../app/composables/useQuotationBook'
import { getQuotationSituationView, isQuotationResult } from '../../app/lib/status/quotations'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

const emptyPage = { items: [], page: 1, pageSize: 20, totalCount: 0, counts: [], insurers: [], modalities: [] }

describe('RN-077 livro de Cotações — composable useQuotationBook', () => {
  it('lista via BFF com defaults de paginação, sem filtros vazios', async () => {
    fetchMock.mockResolvedValueOnce(emptyPage)

    const { listQuotations } = useQuotationBook(api)
    await listQuotations()

    expect(fetchMock).toHaveBeenCalledWith('/api/quotations', {
      method: 'GET',
      query: { page: 1, pageSize: 20 },
    })
  })

  it('só envia os filtros preenchidos (omite null e vazio)', async () => {
    fetchMock.mockResolvedValueOnce(emptyPage)

    const { listQuotations } = useQuotationBook(api)
    await listQuotations({
      page: 2,
      pageSize: 8,
      search: 'pilão',
      situation: 'Analysis',
      insurerId: null,
      modalityId: '',
      premiumMin: 1000,
      createdFrom: '2026-07-01',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/quotations', {
      method: 'GET',
      query: {
        page: 2,
        pageSize: 8,
        search: 'pilão',
        situation: 'Analysis',
        premiumMin: 1000,
        createdFrom: '2026-07-01',
      },
    })
  })

  it('propaga o erro do servidor sem decidir regra no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('500'))

    const { listQuotations } = useQuotationBook(api)

    await expect(listQuotations()).rejects.toThrow()
  })
})

describe('RN-078 situação apresentada da Cotação', () => {
  it('mapeia o resultado por nome estável (situação + cor)', () => {
    expect(getQuotationSituationView('ReadyForEmission')).toEqual({
      label: 'Pronta para emissão',
      color: 'info',
      known: true,
    })
    expect(getQuotationSituationView('Analysis').label).toBe('Em análise')
    expect(getQuotationSituationView('Unavailable').label).toBe('Indisponível')
    expect(getQuotationSituationView('Unrecognized').color).toBe('error')
    expect(isQuotationResult('ReadyForEmission')).toBe(true)
  })

  it('resultado desconhecido cai em fallback honesto (não some)', () => {
    expect(getQuotationSituationView('Foo')).toEqual({
      label: 'Desconhecida',
      color: 'warning',
      known: false,
    })
    expect(getQuotationSituationView(null).known).toBe(false)
    expect(isQuotationResult('Foo')).toBe(false)
  })
})
