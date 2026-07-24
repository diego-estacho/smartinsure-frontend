import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAdditionalCoverageMap } from '../../app/composables/useAdditionalCoverageMap'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-043/RN-046 Mapa de Coberturas Adicionais - composable useAdditionalCoverageMap', () => {
  it('carrega o mapa (catálogo + pendências) via BFF', async () => {
    fetchMock.mockResolvedValueOnce({ coverages: [], pending: [] })
    const { getAdditionalCoverageMap } = useAdditionalCoverageMap(api)

    await getAdditionalCoverageMap()

    expect(fetchMock).toHaveBeenCalledWith('/api/additional-coverage-map', {
      method: 'GET',
    })
  })

  it('RN-043: vincular (ou reatribuir) manda o id da canônica no corpo', async () => {
    fetchMock.mockResolvedValueOnce({ importedCoverageId: 'i-1', additionalCoverageId: 'c-1' })
    const { linkImportedCoverage } = useAdditionalCoverageMap(api)

    await linkImportedCoverage('i-1', 'c-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-additional-coverages/i-1/link', {
      method: 'POST',
      body: { additionalCoverageId: 'c-1' },
    })
  })

  it('RN-043: desvincular desfaz o vínculo (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedCoverageId: 'i-1' })
    const { unlinkImportedCoverage } = useAdditionalCoverageMap(api)

    await unlinkImportedCoverage('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-additional-coverages/i-1/unlink', {
      method: 'POST',
    })
  })

  it('RN-043: ignorar retira da lista de pendências (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedCoverageId: 'i-1', ignored: true })
    const { ignoreImportedCoverage } = useAdditionalCoverageMap(api)

    await ignoreImportedCoverage('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-additional-coverages/i-1/ignore', {
      method: 'POST',
    })
  })

  it('RN-043: reativar desfaz o ignorar (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ importedCoverageId: 'i-1', ignored: false })
    const { restoreImportedCoverage } = useAdditionalCoverageMap(api)

    await restoreImportedCoverage('i-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/imported-additional-coverages/i-1/restore', {
      method: 'POST',
    })
  })
})
