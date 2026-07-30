// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-066 convite de Corretor Administrador - BFF Nitro', () => {
  it('encaminha nome, e-mail e corretoras ao backend com o token da sessão', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({
      id: '01980000-0000-7000-8000-000000000005',
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      status: 'Pending',
    })
    const body = {
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      brokerageIds: ['01980000-0000-7000-8000-000000000021'],
    }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/users/brokerage-administrators.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/users/brokerage-administrators', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      query: undefined,
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
