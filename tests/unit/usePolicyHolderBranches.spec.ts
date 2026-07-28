import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePolicyHolderBranches } from '../../app/composables/usePolicyHolderBranches'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

afterEach(() => {
  fetchMock.mockReset()
})

describe('RN Filial do Tomador — composable usePolicyHolderBranches', () => {
  it('lista as filiais do tomador pelo BFF', async () => {
    fetchMock.mockResolvedValueOnce({
      branches: [
        {
          id: '01990000-0000-7000-8000-000000000002',
          documentNumber: '11222333000262',
          name: 'Acme Filial SP',
          socialName: null,
        },
      ],
    })

    const { listBranches } = usePolicyHolderBranches(api)
    const result = await listBranches('01990000-0000-7000-8000-000000000001')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/policy-holders/01990000-0000-7000-8000-000000000001/branches',
      { method: 'GET' },
    )
    expect(result.branches).toHaveLength(1)
    expect(result.branches[0]!.name).toBe('Acme Filial SP')
  })

  it('registra filial por CNPJ via BFF, sem o browser falar direto com o backend (ADR-008)', async () => {
    fetchMock.mockResolvedValueOnce({
      headquartersId: '01990000-0000-7000-8000-000000000001',
      branchId: '01990000-0000-7000-8000-000000000002',
      notice: null,
    })

    const { createBranch } = usePolicyHolderBranches(api)
    const result = await createBranch('01990000-0000-7000-8000-000000000001', '11222333000262')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/policy-holders/01990000-0000-7000-8000-000000000001/branches',
      { method: 'POST', body: { documentNumber: '11222333000262' } },
    )
    expect(result.branchId).toBe('01990000-0000-7000-8000-000000000002')
    expect(result.notice).toBeNull()
  })

  it('surfaces o notice quando o Birô não acha o CNPJ — matriz continua usável (200 sem branchId)', async () => {
    fetchMock.mockResolvedValueOnce({
      headquartersId: '01990000-0000-7000-8000-000000000001',
      branchId: null,
      notice: 'CNPJ não encontrado no Birô.',
    })

    const { createBranch } = usePolicyHolderBranches(api)
    const result = await createBranch('01990000-0000-7000-8000-000000000001', '99999999000199')

    expect(result.branchId).toBeNull()
    expect(result.notice).toBe('CNPJ não encontrado no Birô.')
  })
})
