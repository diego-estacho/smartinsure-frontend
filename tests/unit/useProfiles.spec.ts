import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProfiles } from '../../app/composables/useProfiles'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-062 — Catálogo de Perfis com Escopo', () => {
  it('lista perfis com filtro de escopo', async () => {
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '01980000-0000-7000-8000-000000000031',
          name: 'BrokerageAdministrator',
          scope: 'Brokerage',
          isFixed: true,
          brokerageId: null,
          policyHolderId: null,
          permissionCount: 0,
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    })

    const { listProfiles } = useProfiles(api)
    const result = await listProfiles({ scope: 'Brokerage' })

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles', {
      method: 'GET',
      query: { page: 1, pageSize: 20, scope: 'Brokerage' },
    })
    expect(result.items[0]!.scope).toBe('Brokerage')
    expect(result.items[0]!.isFixed).toBe(true)
  })
})

describe('RN-063 — Permissões marcadas no Perfil', () => {
  it('traz o perfil sem permissão como lista vazia', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000031',
      name: 'SystemAdministrator',
      scope: 'System',
      isFixed: true,
      brokerageId: null,
      policyHolderId: null,
      permissions: [],
    })

    const { getProfile } = useProfiles(api)
    const result = await getProfile('01980000-0000-7000-8000-000000000031')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/01980000-0000-7000-8000-000000000031',
      { method: 'GET' },
    )
    expect(result.permissions).toHaveLength(0)
  })
})
