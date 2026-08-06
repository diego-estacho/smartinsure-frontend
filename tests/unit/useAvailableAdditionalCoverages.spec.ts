import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAvailableAdditionalCoverages } from '../../app/composables/useAvailableAdditionalCoverages'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-104 Coberturas Adicionais ofertáveis - composable', () => {
  it('RN-104: busca as coberturas ofertáveis da Modalidade pelo BFF', async () => {
    fetchMock.mockResolvedValueOnce({
      items: [
        { id: 'ac-1', name: 'Multas' },
        { id: 'ac-2', name: 'Trabalhista e Previdenciária' },
      ],
    })
    const { listByModality } = useAvailableAdditionalCoverages(api)

    const items = await listByModality('mod-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities/mod-1/additional-coverages', {
      method: 'GET',
    })
    expect(items.map(item => item.name)).toEqual(['Multas', 'Trabalhista e Previdenciária'])
  })

  it('RN-104: modalidade sem cobertura ofertável devolve lista vazia', async () => {
    fetchMock.mockResolvedValueOnce({ items: [] })
    const { listByModality } = useAvailableAdditionalCoverages(api)

    await expect(listByModality('mod-1')).resolves.toEqual([])
  })

  it('RN-104: resposta sem items não quebra a etapa de risco', async () => {
    fetchMock.mockResolvedValueOnce({})
    const { listByModality } = useAvailableAdditionalCoverages(api)

    await expect(listByModality('mod-1')).resolves.toEqual([])
  })
})
