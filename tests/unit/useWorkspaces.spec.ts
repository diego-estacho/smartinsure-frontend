// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaces } from '../../app/composables/useWorkspaces'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

const contextPayload = {
  id: '01980000-0000-7000-8000-000000000001',
  name: 'Carla Souza',
  email: 'carla@corretora.com.br',
  status: 'Active',
  systemProfileName: null,
  activeBrokerageId: '01980000-0000-7000-8000-000000000021',
  activePolicyHolderId: null,
  brokerages: [
    {
      id: '01980000-0000-7000-8000-000000000021',
      documentNumber: '11222333000181',
      name: 'Corretora Alfa',
      profileName: 'BrokerageAdministrator',
      isActive: true,
    },
    {
      id: '01980000-0000-7000-8000-000000000022',
      documentNumber: '44555666000199',
      name: 'Corretora Beta',
      profileName: 'BrokerageAdministrator',
      isActive: false,
    },
  ],
  policyHolders: [],
}

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-064 escopo ativo — composable useWorkspaces', () => {
  it('carrega vínculos e escopo ativo do servidor', async () => {
    fetchMock.mockResolvedValueOnce(contextPayload)

    const { loadContext, workspaces, activeWorkspace, hasWorkspaces } = useWorkspaces(api)
    await loadContext(true)

    expect(fetchMock).toHaveBeenCalledWith('/api/me', { method: 'GET' })
    expect(hasWorkspaces.value).toBe(true)
    expect(workspaces.value).toHaveLength(2)
    // CNPJ formatado para exibição; o dado cru continua vindo do contrato.
    expect(workspaces.value[0]!.document).toBe('11.222.333/0001-81')
    expect(activeWorkspace.value?.name).toBe('Corretora Alfa')
  })

  it('trocar de corretora chama o servidor preservando o tomador ativo e recarrega o contexto', async () => {
    fetchMock.mockResolvedValueOnce(contextPayload)
    const { loadContext, selectWorkspace } = useWorkspaces(api)
    await loadContext(true)

    fetchMock.mockResolvedValueOnce({ activeBrokerageId: '01980000-0000-7000-8000-000000000022', activePolicyHolderId: null })
    fetchMock.mockResolvedValueOnce({ ...contextPayload, activeBrokerageId: '01980000-0000-7000-8000-000000000022' })

    await selectWorkspace('01980000-0000-7000-8000-000000000022')

    expect(fetchMock).toHaveBeenCalledWith('/api/me/active-scope', {
      method: 'POST',
      body: {
        brokerageId: '01980000-0000-7000-8000-000000000022',
        policyHolderId: null,
      },
    })
  })

  it('sem contexto (sessão inválida) fica vazio, sem inventar corretora', async () => {
    fetchMock.mockRejectedValueOnce(new Error('401'))

    const { loadContext, workspaces, hasWorkspaces, activeWorkspace } = useWorkspaces(api)
    await loadContext(true)

    expect(hasWorkspaces.value).toBe(false)
    expect(workspaces.value).toHaveLength(0)
    expect(activeWorkspace.value).toBeNull()
  })

  it('auto-ativa quando há exatamente UMA corretora e nenhuma ativa (item C)', async () => {
    const only = { id: '01980000-0000-7000-8000-000000000021', documentNumber: '11222333000181', name: 'Corretora Única', profileName: 'BrokerageAdministrator', isActive: false }
    const single = { ...contextPayload, activeBrokerageId: null, brokerages: [only] }
    // 1) GET /api/me (sem ativa) → 2) POST active-scope (auto) → 3) GET /api/me (ativa reemitida)
    fetchMock.mockResolvedValueOnce(single)
    fetchMock.mockResolvedValueOnce({})
    fetchMock.mockResolvedValueOnce({ ...single, activeBrokerageId: only.id })

    const { loadContext, activeWorkspace } = useWorkspaces(api)
    await loadContext(true)

    expect(fetchMock).toHaveBeenCalledWith('/api/me/active-scope', {
      method: 'POST',
      body: { brokerageId: only.id, policyHolderId: null },
    })
    expect(activeWorkspace.value?.id).toBe(only.id)
  })

  it('NÃO auto-ativa quando há 2+ corretoras e nenhuma ativa — a escolha é do usuário (gate)', async () => {
    fetchMock.mockResolvedValueOnce({ ...contextPayload, activeBrokerageId: null })

    const { loadContext, activeWorkspace } = useWorkspaces(api)
    await loadContext(true)

    // Só o GET do contexto; nenhum POST de active-scope (não escolhe sozinho quando há mais de uma).
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(activeWorkspace.value).toBeNull()
  })
})
