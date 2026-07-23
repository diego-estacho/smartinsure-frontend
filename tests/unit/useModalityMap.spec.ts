import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModalityMap } from '../../app/composables/useModalityMap'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-036/RN-037 Mapa de Modalidades - composable useModalityMap', () => {
  it('carrega o mapa (matriz + Fila) via BFF', async () => {
    fetchMock.mockResolvedValueOnce({ modalities: [], pending: [] })
    const { getModalityMap } = useModalityMap(api)

    await getModalityMap()

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-map', {
      method: 'GET',
    })
  })

  it('RN-037: reatribuir define manualmente a Modalidade da Importada (override)', async () => {
    fetchMock.mockResolvedValueOnce({ importedModalityId: 'i-1', modalityId: 'm-1', linkSource: 'Manual' })
    const { reassignImportedModality } = useModalityMap(api)

    await reassignImportedModality('i-1', 'm-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-modalities/i-1/reassign', {
      method: 'POST',
      body: { modalityId: 'm-1' },
    })
  })

  it('RN-037: ignorar marca a Modalidade Importada como Ignorada (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedModalityId: 'i-1', ignored: true })
    const { ignoreImportedModality } = useModalityMap(api)

    await ignoreImportedModality('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-modalities/i-1/ignore', {
      method: 'POST',
    })
  })

  it('RN-037: reativar desfaz o Ignorar (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedModalityId: 'i-1', ignored: false })
    const { restoreImportedModality } = useModalityMap(api)

    await restoreImportedModality('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-modalities/i-1/restore', {
      method: 'POST',
    })
  })
})
