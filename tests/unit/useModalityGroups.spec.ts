import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModalityGroups } from '../../app/composables/useModalityGroups'
import { modalityGroupStatuses } from '../../app/lib/status/modality-groups'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-029 Grupo de Modalidade - composable useModalityGroups', () => {
  it('lista via BFF só ativos por padrão (includeInactive omitido)', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, totalCount: 0 })
    const { listModalityGroups } = useModalityGroups(api)

    await listModalityGroups()

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-groups', {
      method: 'GET',
      query: { page: 1, pageSize: 100 },
    })
  })

  it('inclui inativos quando pedido', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 100, totalCount: 0 })
    const { listModalityGroups } = useModalityGroups(api)

    await listModalityGroups({ includeInactive: true })

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-groups', {
      method: 'GET',
      query: { page: 1, pageSize: 100, includeInactive: true },
    })
  })

  it('cria enviando initialStatus Active (item curado nasce Ativo)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'g-1', status: modalityGroupStatuses.active })
    const { createModalityGroup } = useModalityGroups(api)

    await createModalityGroup({ name: 'Fiança', description: 'Grupo de fiança', displayOrder: 1 })

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-groups', {
      method: 'POST',
      body: {
        name: 'Fiança',
        description: 'Grupo de fiança',
        displayOrder: 1,
        initialStatus: modalityGroupStatuses.active,
      },
    })
  })

  it('atualiza o Grupo existente via PUT', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'g-1' })
    const { updateModalityGroup } = useModalityGroups(api)

    await updateModalityGroup('g-1', { name: 'Garantia', description: null, displayOrder: 2 })

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-groups/g-1', {
      method: 'PUT',
      body: { name: 'Garantia', description: null, displayOrder: 2 },
    })
  })

  it('RN-036: alterna a situação pelo nome estável (nunca exclui)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'g-1', status: modalityGroupStatuses.inactive })
    const { changeModalityGroupStatus } = useModalityGroups(api)

    await changeModalityGroupStatus('g-1', modalityGroupStatuses.inactive)

    expect(fetchMock).toHaveBeenCalledWith('/api/modality-groups/g-1/status', {
      method: 'PATCH',
      body: { status: 'Inactive' },
    })
  })
})
