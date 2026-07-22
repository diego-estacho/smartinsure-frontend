import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModalities } from '../../app/composables/useModalities'
import { modalityStatuses } from '../../app/lib/status/modalities'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-029 Modalidade - composable useModalities', () => {
  it('lista via BFF só ativas por padrão (includeInactive omitido)', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, totalCount: 0 })
    const { listModalities } = useModalities(api)

    await listModalities()

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities', {
      method: 'GET',
      query: { page: 1, pageSize: 100 },
    })
  })

  it('inclui inativas quando pedido', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, totalCount: 0 })
    const { listModalities } = useModalities(api)

    await listModalities({ includeInactive: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities', {
      method: 'GET',
      query: { page: 1, pageSize: 100, includeInactive: true },
    })
  })

  it('cria sem Grupo (ADR-061), com initialStatus Active (item curado nasce Ativo)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'm-1', status: modalityStatuses.active })
    const { createModality } = useModalities(api)

    await createModality({ name: 'Fiança locatícia', description: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities', {
      method: 'POST',
      body: {
        name: 'Fiança locatícia',
        description: null,
        initialStatus: modalityStatuses.active,
      },
    })
  })

  it('atualiza a Modalidade existente via PUT (só nome/descrição, sem Grupo — ADR-061)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'm-1' })
    const { updateModality } = useModalities(api)

    await updateModality('m-1', { name: 'Fiança', description: 'nova' })

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities/m-1', {
      method: 'PUT',
      body: { name: 'Fiança', description: 'nova' },
    })
  })

  it('RN-036: alterna a situação pelo nome estável (nunca exclui)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'm-1', status: modalityStatuses.inactive })
    const { changeModalityStatus } = useModalities(api)

    await changeModalityStatus('m-1', modalityStatuses.inactive)

    expect(fetchMock).toHaveBeenCalledWith('/api/modalities/m-1/status', {
      method: 'PATCH',
      body: { status: 'Inactive' },
    })
  })
})
