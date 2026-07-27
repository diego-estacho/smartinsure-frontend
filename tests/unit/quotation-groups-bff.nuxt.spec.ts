// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-050/RN-051 Grupo de Cotação - BFF Nitro', () => {
  const body = {
    policyHolderId: 'p-1',
    insuredId: 'i-1',
    modalityId: 'm-1',
    insuredAmount: 1000,
    coverageStartDate: '2026-01-01',
    coverageEndDate: '2026-02-01',
    scopeMode: 'All',
    insurerIds: [],
    includesPenaltyCoverage: false,
    includesLaborCoverage: false,
  }

  it('encaminha corpo e token ao criar (POST), sem o browser falar direto (ADR-008, RN-050)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'qg-1', status: 'Draft' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/quotation-groups.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/quotation-groups', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha corpo, token e rota ao atualizar em Rascunho (PUT /{id}, RN-051)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'qg-1', status: 'Draft' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'qg-1')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/quotation-groups/[id].put')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/quotation-groups/qg-1', {
      baseURL: 'https://backend.test',
      method: 'PUT',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
