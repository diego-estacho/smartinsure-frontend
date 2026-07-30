import { describe, expect, it, vi } from 'vitest'
import { useUsers } from '../../app/composables/useUsers'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

describe('RN-001 criação de Usuário — composable useUsers', () => {
  it('envia a criação via BFF, nunca direto ao backend', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '0197...',
      name: 'Maria Silva',
      email: 'maria@corretora.com.br',
      status: 'Pending',
    })

    const { createUser } = useUsers(api)
    const user = await createUser({ name: 'Maria Silva', email: 'maria@corretora.com.br' })

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      body: { name: 'Maria Silva', email: 'maria@corretora.com.br' },
    })
    expect(user.status).toBe('Pending')
  })

  it('propaga o erro do servidor sem decidir regra no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { createUser } = useUsers(api)

    await expect(
      createUser({ name: 'Maria Silva', email: 'maria@corretora.com.br' }),
    ).rejects.toThrow()
  })
})

describe('RN-012 leitura de Usuários — listagem e detalhe', () => {
  it('lista com paginação, busca e filtro de situação', async () => {
    fetchMock.mockResolvedValueOnce({
      items: [
        {
          id: '01980000-0000-7000-8000-000000000001',
          name: 'Ana',
          email: 'ana@exemplo.com',
          status: 'Active',
          profileName: 'SystemAdministrator',
          createdAt: '2026-07-20T12:00:00Z',
        },
      ],
      page: 1,
      pageSize: 20,
      totalCount: 1,
    })

    const { listUsers } = useUsers(api)
    const result = await listUsers({ page: 1, pageSize: 20, search: 'ana', status: 'Active' })

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'GET',
      query: { page: 1, pageSize: 20, search: 'ana', status: 'Active' },
    })
    expect(result.items[0]!.profileName).toBe('SystemAdministrator')
  })

  it('omite busca e situação quando não informados', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalCount: 0 })

    const { listUsers } = useUsers(api)
    await listUsers()

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'GET',
      query: { page: 1, pageSize: 20 },
    })
  })
})

describe('RN-066 convite de Corretor Administrador — composable useUsers', () => {
  it('envia nome, e-mail e corretoras via BFF', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000005',
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      status: 'Pending',
    })

    const { inviteBrokerageAdministrator } = useUsers(api)
    const invited = await inviteBrokerageAdministrator({
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      brokerageIds: ['01980000-0000-7000-8000-000000000021'],
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/brokerage-administrators', {
      method: 'POST',
      body: {
        name: 'Carla Souza',
        email: 'carla@corretora.com.br',
        brokerageIds: ['01980000-0000-7000-8000-000000000021'],
      },
    })
    expect(invited.status).toBe('Pending')
  })

  it('propaga a recusa do servidor sem decidir regra no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { inviteBrokerageAdministrator } = useUsers(api)

    await expect(inviteBrokerageAdministrator({
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      brokerageIds: ['01980000-0000-7000-8000-000000000021'],
    })).rejects.toThrow()
  })
})

describe('RN-064 vínculos do Usuário com Corretoras e Tomadores', () => {
  it('traz os vínculos com o perfil de cada escopo no detalhe', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000001',
      name: 'Ana',
      email: 'ana@exemplo.com',
      status: 'Active',
      profileId: null,
      profileName: null,
      createdAt: '2026-07-20T12:00:00Z',
      brokerageMemberships: [
        {
          id: '01980000-0000-7000-8000-000000000011',
          scopeId: '01980000-0000-7000-8000-000000000021',
          scopeDocumentNumber: '11222333000181',
          scopeName: 'Corretora Alfa',
          profileId: '01980000-0000-7000-8000-000000000031',
          profileName: 'BrokerageAdministrator',
        },
      ],
      policyHolderMemberships: [],
    })

    const { getUser } = useUsers(api)
    const result = await getUser('01980000-0000-7000-8000-000000000001')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/01980000-0000-7000-8000-000000000001',
      { method: 'GET' },
    )
    expect(result.brokerageMemberships[0]!.scopeName).toBe('Corretora Alfa')
    expect(result.brokerageMemberships[0]!.profileName).toBe('BrokerageAdministrator')
    expect(result.policyHolderMemberships).toHaveLength(0)
  })
})
