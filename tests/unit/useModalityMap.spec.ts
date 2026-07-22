import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModalityMap } from '../../app/composables/useModalityMap'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-033/RN-034 Mapa de Modalidades - composable useModalityMap', () => {
  it('carrega o mapa (matriz + Fila) via BFF', async () => {
    fetchMock.mockResolvedValueOnce({ modalities: [], pending: [] })
    const { getModalityMap } = useModalityMap(api)

    await getModalityMap()

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-map', {
      method: 'GET',
    })
  })

  it('RN-034: mapear confirma a Modalidade Importada a uma Modalidade existente', async () => {
    fetchMock.mockResolvedValueOnce({ importedModalityId: 'i-1', modalityId: 'm-1', mappingStatus: 'Confirmed' })
    const { mapImportedModality } = useModalityMap(api)

    await mapImportedModality('i-1', 'm-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-modalities/i-1/map', {
      method: 'POST',
      body: { modalityId: 'm-1' },
    })
  })

  it('RN-034: ignorar marca a Modalidade Importada como Ignorada (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedModalityId: 'i-1', ignored: true })
    const { ignoreImportedModality } = useModalityMap(api)

    await ignoreImportedModality('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-modalities/i-1/ignore', {
      method: 'POST',
    })
  })
})
