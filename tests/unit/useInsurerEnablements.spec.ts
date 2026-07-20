import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInsurerEnablements } from '../../app/composables/useInsurerEnablements'
import { enablementStatuses } from '../../app/lib/status/insurer-enablements'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN-022 Habilitação de Seguradora - composable useInsurerEnablements', () => {
  it('lista as habilitações da corretora via BFF', async () => {
    fetchMock.mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalCount: 0 })
    const { listEnablements } = useInsurerEnablements(api)

    await listEnablements({ brokerageId: 'b-1' })

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerage-insurer-enablements', {
      method: 'GET',
      query: { brokerageId: 'b-1', page: 1, pageSize: 20 },
    })
  })

  it('cria habilitação enviando os parâmetros de conexão como JSON opaco', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'e-1' })
    const { createEnablement } = useInsurerEnablements(api)
    const connectionParameters = JSON.stringify({ baseUrl: 'https://plug.example.com', key: 'k' })

    await createEnablement({
      brokerageId: 'b-1',
      insurerId: 'i-1',
      calculationEngine: 'PlugV2',
      connectionParameters,
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerage-insurer-enablements', {
      method: 'POST',
      body: {
        brokerageId: 'b-1',
        insurerId: 'i-1',
        calculationEngine: 'PlugV2',
        connectionParameters,
      },
    })
  })

  it('atualiza motor e parâmetros da habilitação existente', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'e-1' })
    const { updateEnablement } = useInsurerEnablements(api)

    await updateEnablement('e-1', { calculationEngine: 'PlugV2', connectionParameters: null })

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerage-insurer-enablements/e-1', {
      method: 'PUT',
      body: { calculationEngine: 'PlugV2', connectionParameters: null },
    })
  })

  it('alterna a situação pelo nome estável (nunca exclui)', async () => {
    fetchMock.mockResolvedValueOnce({ id: 'e-1', status: 'Inactive' })
    const { changeEnablementStatus } = useInsurerEnablements(api)

    await changeEnablementStatus('e-1', enablementStatuses.inactive)

    expect(fetchMock).toHaveBeenCalledWith('/api/brokerage-insurer-enablements/e-1/status', {
      method: 'PATCH',
      body: { status: 'Inactive' },
    })
  })
})

describe('RN-023 Seleção do Motor de Cálculo - motores disponíveis', () => {
  it('consulta os motores disponíveis pelo nome estável via BFF', async () => {
    fetchMock.mockResolvedValueOnce([{ name: 'PlugV2' }])
    const { listCalculationEngines } = useInsurerEnablements(api)

    const engines = await listCalculationEngines()

    expect(fetchMock).toHaveBeenCalledWith('/api/calculation-engines', { method: 'GET' })
    expect(engines).toEqual([{ name: 'PlugV2' }])
  })
})
