import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAdditionalCoverages } from '../../app/composables/useAdditionalCoverages'
import { additionalCoverageStatuses } from '../../app/lib/status/additionalCoverages'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-040 Cobertura Adicional - composable useAdditionalCoverages', () => {
  it('cria a canônica com o corpo { name } (RN-040: só nome)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'c-1', name: 'Multa', status: 'Active' })
    const { createAdditionalCoverage } = useAdditionalCoverages(api)

    await createAdditionalCoverage({ name: 'Multa' })

    expect(fetchMock).toHaveBeenCalledWith('/api/additional-coverages', {
      method: 'POST',
      body: { name: 'Multa' },
    })
  })

  it('atualiza a canônica existente via PUT com { name }', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'c-1', name: 'Multa Rescisória', status: 'Active' })
    const { updateAdditionalCoverage } = useAdditionalCoverages(api)

    await updateAdditionalCoverage('c-1', { name: 'Multa Rescisória' })

    expect(fetchMock).toHaveBeenCalledWith('/api/additional-coverages/c-1', {
      method: 'PUT',
      body: { name: 'Multa Rescisória' },
    })
  })

  it('ativa pelo endpoint dedicado (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'c-1', status: 'Active' })
    const { activateAdditionalCoverage } = useAdditionalCoverages(api)

    await activateAdditionalCoverage('c-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/additional-coverages/c-1/activate', {
      method: 'POST',
    })
  })

  it('inativa pelo endpoint dedicado (sem corpo)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'c-1', status: 'Inactive' })
    const { inactivateAdditionalCoverage } = useAdditionalCoverages(api)

    await inactivateAdditionalCoverage('c-1')

    expect(fetchMock).toHaveBeenCalledWith('/api/additional-coverages/c-1/inactivate', {
      method: 'POST',
    })
  })

  it('RN-040/RN-044: changeStatus roteia pela situação-alvo (nome estável) para o endpoint certo', async () => {
    fetchMock.mockResolvedValue({ id: 'c-1', status: 'Inactive' })
    const { changeAdditionalCoverageStatus } = useAdditionalCoverages(api)

    await changeAdditionalCoverageStatus('c-1', additionalCoverageStatuses.inactive)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/additional-coverages/c-1/inactivate', {
      method: 'POST',
    })

    await changeAdditionalCoverageStatus('c-1', additionalCoverageStatuses.active)
    expect(fetchMock).toHaveBeenLastCalledWith('/api/additional-coverages/c-1/activate', {
      method: 'POST',
    })
  })
})
