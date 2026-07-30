import { afterEach, describe, expect, it, vi } from 'vitest'
import { useProfiles } from '../../app/composables/useProfiles'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-069/RN-070 perfil customizado do escopo ativo', () => {
  it('cria perfil enviando nome e permissões, sem escopo no corpo', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000061',
      name: 'Operador',
      scope: 'Brokerage',
      brokerageId: '01980000-0000-7000-8000-000000000021',
      policyHolderId: null,
      permissionCount: 2,
    })

    const { createProfile } = useProfiles(api)
    const created = await createProfile({
      name: 'Operador',
      permissionCodes: ['quotation-groups.view', 'policy-holders.view'],
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles', {
      method: 'POST',
      body: {
        name: 'Operador',
        permissionCodes: ['quotation-groups.view', 'policy-holders.view'],
      },
    })
    // O escopo é decisão do servidor (ADR-065): nada de corretora/tomador no corpo.
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain('brokerageId')
    expect(created.permissionCount).toBe(2)
  })

  it('propaga a recusa de nome repetido no escopo', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { createProfile } = useProfiles(api)

    await expect(createProfile({ name: 'Operador', permissionCodes: [] })).rejects.toThrow()
  })

  it('aceita perfil sem permissão (RN-062)', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000062',
      name: 'Somente leitura',
      scope: 'Brokerage',
      brokerageId: null,
      policyHolderId: null,
      permissionCount: 0,
    })

    const { createProfile } = useProfiles(api)
    const created = await createProfile({ name: 'Somente leitura', permissionCodes: [] })

    expect(created.permissionCount).toBe(0)
  })
})

describe('RN-074 edição e remoção de perfil customizado', () => {
  it('edita nome e permissões', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01980000-0000-7000-8000-000000000061',
      name: 'Operador Sênior',
      scope: 'Brokerage',
      permissionCount: 1,
    })

    const { updateProfile } = useProfiles(api)
    const updated = await updateProfile('01980000-0000-7000-8000-000000000061', {
      name: 'Operador Sênior',
      permissionCodes: ['policy-holders.view'],
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/01980000-0000-7000-8000-000000000061', {
      method: 'PUT',
      body: { name: 'Operador Sênior', permissionCodes: ['policy-holders.view'] },
    })
    expect(updated.name).toBe('Operador Sênior')
  })

  it('remove perfil pelo id', async () => {
    fetchMock.mockResolvedValueOnce(undefined)

    const { deleteProfile } = useProfiles(api)
    await deleteProfile('01980000-0000-7000-8000-000000000061')

    expect(fetchMock).toHaveBeenCalledWith('/api/profiles/01980000-0000-7000-8000-000000000061', {
      method: 'DELETE',
    })
  })

  it('propaga a recusa quando o perfil está em uso', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { deleteProfile } = useProfiles(api)

    await expect(deleteProfile('01980000-0000-7000-8000-000000000061')).rejects.toThrow()
  })
})

describe('RN-063 catálogo de permissões', () => {
  it('busca o catálogo fixo no servidor', async () => {
    fetchMock.mockResolvedValueOnce([
      {
        id: '01980000-0000-7000-8000-000000000071',
        code: 'users.create',
        description: 'Criar e convidar Usuário',
        isSystem: true,
      },
    ])

    const { listPermissions } = useProfiles(api)
    const permissions = await listPermissions()

    expect(fetchMock).toHaveBeenCalledWith('/api/permissions', { method: 'GET' })
    expect(permissions[0]!.code).toBe('users.create')
  })
})
