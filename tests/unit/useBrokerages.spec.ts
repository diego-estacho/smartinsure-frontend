import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBrokerages } from '../../app/composables/useBrokerages'
import { brokerageStatuses, getBrokerageStatusAction } from '../../app/lib/status/brokerages'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-018 listagem de Corretoras - composable useBrokerages', () => {
  it('consulta a lista via BFF com filtro de situacao por nome estavel', async () => {
    fetchMock.mockResolvedValueOnce({
      items: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    })

    const { listBrokerages } = useBrokerages(api)
    await listBrokerages({ status: brokerageStatuses.active })

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerages', {
      method: 'GET',
      query: {
        page: 1,
        pageSize: 20,
        status: brokerageStatuses.active,
      },
    })
  })
})

describe('RN-019 criacao de Corretora por CNPJ - composable useBrokerages', () => {
  it('envia o CNPJ ao BFF sem chamar o backend direto', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01990000-0000-7000-8000-000000000001',
      documentNumber: '11222333000181',
      name: 'Alfa Corretora',
      socialName: null,
      legalNatureCode: null,
      legalNatureName: null,
      isPrivateSector: true,
      status: brokerageStatuses.active,
      mainAddress: null,
    })

    const { createBrokerage } = useBrokerages(api)
    const brokerage = await createBrokerage({ cnpj: '11222333000181' })

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerages', {
      method: 'POST',
      body: { cnpj: '11222333000181' },
    })
    expect(brokerage.status).toBe(brokerageStatuses.active)
  })
})

describe('RN-020 detalhes da Corretora - composable useBrokerages', () => {
  it('busca detalhes pelo BFF usando o identificador da corretora', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01990000-0000-7000-8000-000000000001',
      documentNumber: '11222333000181',
      name: 'Alfa Corretora',
      socialName: null,
      legalNatureCode: null,
      legalNatureName: null,
      isPrivateSector: true,
      status: brokerageStatuses.active,
      mainAddress: null,
    })

    const { getBrokerage } = useBrokerages(api)
    await getBrokerage('01990000-0000-7000-8000-000000000001')

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerages/01990000-0000-7000-8000-000000000001', {
      method: 'GET',
    })
  })
})

describe('RN-021 ativacao e inativacao de Corretora - composable useBrokerages', () => {
  it('envia a alteracao de situacao via BFF com status centralizado', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '01990000-0000-7000-8000-000000000001',
      status: brokerageStatuses.inactive,
    })

    const { changeBrokerageStatus } = useBrokerages(api)
    await changeBrokerageStatus('01990000-0000-7000-8000-000000000001', brokerageStatuses.inactive)

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerages/01990000-0000-7000-8000-000000000001/status', {
      method: 'PATCH',
      body: { status: brokerageStatuses.inactive },
    })
  })

  it('falha fechado para status desconhecido, sem escolher acao manualmente', () => {
    const action = getBrokerageStatusAction('Suspended')

    expect(action.disabled).toBe(true)
    expect(action.targetStatus).toBeNull()
  })
})
