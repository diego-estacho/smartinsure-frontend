import { afterEach, describe, expect, it, vi } from 'vitest'
import type { components } from '../../app/types/gen/api'
import { useQuotationMinuta } from '../../app/composables/useQuotationMinuta'

type SubmitBody = components['schemas']['SubmitQuotationMinutaBody']

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-062/RN-063 — composable useQuotationMinuta (BFF)', () => {
  it('lê a minuta (Tags + Cláusulas) via GET', async () => {
    fetchMock.mockResolvedValueOnce({ tagJson: '{}', clauses: [] })

    const { getMinuta } = useQuotationMinuta(api)
    await getMinuta('g-1', 'q-1')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quotation-groups/g-1/quotations/q-1/minuta',
      { method: 'GET' },
    )
  })

  it('envia os termos e devolve a minuta via POST submit', async () => {
    fetchMock.mockResolvedValueOnce({ draftUrl: 'https://x/draft.pdf', draftExternalId: 'd-1', draftCreatedAt: null })

    const body: SubmitBody = {
      brokerageId: 'brk-1',
      terms: [{ name: 'objeto', value: 'Fornecimento' }],
      particularClauses: [{ particularClauseExternalId: '10', tags: [{ name: 'perc', value: '5' }] }],
    }

    const { submitMinuta } = useQuotationMinuta(api)
    const result = await submitMinuta('g-1', 'q-1', body)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quotation-groups/g-1/quotations/q-1/minuta/submit',
      { method: 'POST', body },
    )
    expect(result.draftUrl).toBe('https://x/draft.pdf')
  })
})
