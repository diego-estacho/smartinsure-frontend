import { afterEach, describe, expect, it, vi } from 'vitest'
import { useUsers } from '../../app/composables/useUsers'
import { useProfiles } from '../../app/composables/useProfiles'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-070 Tomador Administrador cria usuário do tomador ativo', () => {
  it('envia nome, e-mail e perfil — o tomador fica com o servidor', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000081',
      name: 'Novo Tomador',
      email: 'usuario@tomador.com.br',
      status: 'Pending',
      policyHolderId: '01980000-0000-7000-8000-000000000041',
      profileId: '01980000-0000-7000-8000-000000000055',
      profileName: 'PolicyHolderUser',
    })

    const { invitePolicyHolderUser } = useUsers(api)
    const invited = await invitePolicyHolderUser({
      name: 'Novo Tomador',
      email: 'usuario@tomador.com.br',
      profileId: '01980000-0000-7000-8000-000000000055',
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/policy-holder-users', {
      method: 'POST',
      body: {
        name: 'Novo Tomador',
        email: 'usuario@tomador.com.br',
        profileId: '01980000-0000-7000-8000-000000000055',
      },
    })
    // O tomador ativo vem do acesso (ADR-065): nada de policyHolderId no corpo.
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain('policyHolderId')
    expect(invited.profileName).toBe('PolicyHolderUser')
  })

  it('propaga a recusa de perfil de outro tomador', async () => {
    fetchMock.mockRejectedValueOnce(new Error('422'))

    const { invitePolicyHolderUser } = useUsers(api)

    await expect(invitePolicyHolderUser({
      name: 'Novo Tomador',
      email: 'usuario@tomador.com.br',
      profileId: '01980000-0000-7000-8000-000000000055',
    })).rejects.toThrow()
  })
})

describe('RN-073 Administrador do Sistema edita permissões de perfil fixo', () => {
  it('envia apenas as permissões — nome e escopo do perfil fixo são imutáveis', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000051',
      name: 'BrokerageUser',
      scope: 'Brokerage',
      permissionCount: 3,
    })

    const { updateFixedProfilePermissions } = useProfiles(api)
    const updated = await updateFixedProfilePermissions('01980000-0000-7000-8000-000000000051', {
      permissionCodes: ['quotation-groups.view', 'quotation-groups.create', 'policy-holders.view'],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/profiles/01980000-0000-7000-8000-000000000051/permissions',
      {
        method: 'PUT',
        body: {
          permissionCodes: [
            'quotation-groups.view',
            'quotation-groups.create',
            'policy-holders.view',
          ],
        },
      },
    )
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain('"name"')
    expect(updated.permissionCount).toBe(3)
  })

  it('desmarcar tudo é válido — o perfil fica sem autorizar operação alguma', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000051',
      name: 'BrokerageUser',
      scope: 'Brokerage',
      permissionCount: 0,
    })

    const { updateFixedProfilePermissions } = useProfiles(api)
    const updated = await updateFixedProfilePermissions('01980000-0000-7000-8000-000000000051', {
      permissionCodes: [],
    })

    expect(updated.permissionCount).toBe(0)
  })

  it('propaga a recusa quando o solicitante não é Administrador do Sistema', async () => {
    fetchMock.mockRejectedValueOnce(new Error('403'))

    const { updateFixedProfilePermissions } = useProfiles(api)

    await expect(updateFixedProfilePermissions('01980000-0000-7000-8000-000000000051', {
      permissionCodes: [],
    })).rejects.toThrow()
  })
})
