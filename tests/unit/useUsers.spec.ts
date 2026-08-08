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

describe('RN-202 edição de Usuário — composable useUsers', () => {
  it('edita via PUT no BFF enviando nome e e-mail', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000001',
      name: 'Ana Paula',
      email: 'ana.paula@exemplo.com',
      status: 'Pending',
    })

    const { editUser } = useUsers(api)
    const result = await editUser('01980000-0000-7000-8000-000000000001', {
      name: 'Ana Paula',
      email: 'ana.paula@exemplo.com',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/01980000-0000-7000-8000-000000000001', {
      method: 'PUT',
      body: { name: 'Ana Paula', email: 'ana.paula@exemplo.com' },
    })
    expect(result.email).toBe('ana.paula@exemplo.com')
  })

  it('renomeia sem tocar no e-mail quando email é nulo', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000001',
      name: 'Ana Paula',
      email: 'ana@exemplo.com',
      status: 'Active',
    })

    const { editUser } = useUsers(api)
    await editUser('01980000-0000-7000-8000-000000000001', { name: 'Ana Paula', email: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/01980000-0000-7000-8000-000000000001', {
      method: 'PUT',
      body: { name: 'Ana Paula', email: null },
    })
  })

  it('propaga a recusa do servidor (e-mail de não-Pendente) sem decidir no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { editUser } = useUsers(api)

    await expect(editUser('01980000-0000-7000-8000-000000000001', {
      name: 'Ana',
      email: 'novo@exemplo.com',
    })).rejects.toThrow()
  })
})

describe('RN-075 troca de Perfil no vínculo — composable useUsers', () => {
  it('troca o perfil do vínculo via PUT scope-profile', async () => {
    fetchMock.mockResolvedValueOnce({
      userId: '01980000-0000-7000-8000-000000000001',
      scopeId: '01980000-0000-7000-8000-000000000021',
      profileId: '01980000-0000-7000-8000-000000000031',
      profileName: 'Comercial',
    })

    const { changeScopeProfile } = useUsers(api)
    const result = await changeScopeProfile('01980000-0000-7000-8000-000000000001', {
      scopeId: '01980000-0000-7000-8000-000000000021',
      profileId: '01980000-0000-7000-8000-000000000031',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/01980000-0000-7000-8000-000000000001/scope-profile',
      {
        method: 'PUT',
        body: {
          scopeId: '01980000-0000-7000-8000-000000000021',
          profileId: '01980000-0000-7000-8000-000000000031',
        },
      },
    )
    expect(result.profileName).toBe('Comercial')
  })
})

describe('RN-012 concessão/revogação do Perfil de Sistema — composable useUsers', () => {
  it('envia o perfil (ou nulo para revogar) via PUT profile', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000001',
      profile: null,
    })

    const { setUserProfile } = useUsers(api)
    await setUserProfile('01980000-0000-7000-8000-000000000001', null)

    expect(fetchMock).toHaveBeenCalledWith('/api/users/01980000-0000-7000-8000-000000000001/profile', {
      method: 'PUT',
      body: { profile: null },
    })
  })
})

describe('RN-203 redefinição de senha — composable useUsers', () => {
  it('dispara a redefinição via POST no BFF', async () => {
    fetchMock.mockResolvedValueOnce({
      userId: '01980000-0000-7000-8000-000000000001',
      email: 'ana@exemplo.com',
    })

    const { requestPasswordReset } = useUsers(api)
    const result = await requestPasswordReset('01980000-0000-7000-8000-000000000001')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/users/01980000-0000-7000-8000-000000000001/password-reset',
      { method: 'POST' },
    )
    expect(result.email).toBe('ana@exemplo.com')
  })

  it('propaga a recusa do servidor (usuário não-ativo) sem decidir no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { requestPasswordReset } = useUsers(api)

    await expect(
      requestPasswordReset('01980000-0000-7000-8000-000000000001'),
    ).rejects.toThrow()
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
