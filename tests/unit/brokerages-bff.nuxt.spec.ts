// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'
import { brokerageStatuses } from '../../app/lib/status/brokerages'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-021 ativacao e inativacao de Corretora - BFF Nitro', () => {
  it('encaminha corpo, token e rota de status ao backend', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({
      id: '01990000-0000-7000-8000-000000000001',
      status: brokerageStatuses.inactive,
    })
    const body = { status: brokerageStatuses.inactive }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => '01990000-0000-7000-8000-000000000001')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/brokerages/[id]/status.patch')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/brokerages/01990000-0000-7000-8000-000000000001/status', {
      baseURL: 'https://backend.test',
      method: 'PATCH',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
