import { afterEach, describe, expect, it, vi } from 'vitest'
import { useUsers } from '../../app/composables/useUsers'
import { useProfiles } from '../../app/composables/useProfiles'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-068 Corretor Administrador cria Tomador Administrador', () => {
  it('envia nome, e-mail e tomador — a corretora ativa fica com o servidor', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000031',
      name: 'Novo TA',
      email: 'ta@tomador.com.br',
      status: 'Pending',
      policyHolderId: '01980000-0000-7000-8000-000000000041',
    })

    const { invitePolicyHolderAdministrator } = useUsers(api)
    const invited = await invitePolicyHolderAdministrator({
      name: 'Novo TA',
      email: 'ta@tomador.com.br',
      policyHolderId: '01980000-0000-7000-8000-000000000041',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/policy-holder-administrators', {
      method: 'POST',
      body: {
        name: 'Novo TA',
        email: 'ta@tomador.com.br',
        policyHolderId: '01980000-0000-7000-8000-000000000041',
      },
    })
    // Nenhum campo de corretora sai do cliente — o escopo é decisão do servidor (ADR-065).
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain('brokerageId')
    expect(invited.status).toBe('Pending')
  })

  it('propaga a recusa quando o tomador não tem nomeação vigente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('422'))

    const { invitePolicyHolderAdministrator } = useUsers(api)

    await expect(invitePolicyHolderAdministrator({
      name: 'Novo TA',
      email: 'ta@tomador.com.br',
      policyHolderId: '01980000-0000-7000-8000-000000000041',
    })).rejects.toThrow()
  })
})

describe('RN-069 Corretor Administrador cria Usuário da corretora', () => {
  it('envia nome, e-mail e perfil escolhido', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000032',
      name: 'Novo Corretor',
      email: 'corretor@corretora.com.br',
      status: 'Pending',
      brokerageId: '01980000-0000-7000-8000-000000000021',
      profileId: '01980000-0000-7000-8000-000000000051',
      profileName: 'BrokerageUser',
    })

    const { inviteBrokerageUser } = useUsers(api)
    const invited = await inviteBrokerageUser({
      name: 'Novo Corretor',
      email: 'corretor@corretora.com.br',
      profileId: '01980000-0000-7000-8000-000000000051',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/brokerage-users', {
      method: 'POST',
      body: {
        name: 'Novo Corretor',
        email: 'corretor@corretora.com.br',
        profileId: '01980000-0000-7000-8000-000000000051',
      },
    })
    expect(invited.profileName).toBe('BrokerageUser')
  })
})

describe('RN-072 perfis atribuíveis no escopo ativo', () => {
  it('busca no servidor a lista do próprio solicitante', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        id: '01980000-0000-7000-8000-000000000051',
        name: 'BrokerageUser',
        scope: 'Brokerage',
        isFixed: true,
        brokerageId: null,
        policyHolderId: null,
      },
      {
        id: '01980000-0000-7000-8000-000000000052',
        name: 'PolicyHolderAdministrator',
        scope: 'PolicyHolder',
        isFixed: true,
        brokerageId: null,
        policyHolderId: null,
      },
    ])

    const { listAssignableProfiles } = useProfiles(api)
    const profiles = await listAssignableProfiles()

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/assignable', { method: 'GET' })
    expect(profiles).toHaveLength(2)
    // O escopo do perfil é o que decide se a tela pede o Tomador (RN-068).
    expect(profiles[1]!.scope).toBe('PolicyHolder')
  })
})
