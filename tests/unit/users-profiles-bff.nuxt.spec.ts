// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-012 leitura de Usuários - BFF Nitro', () => {
  it('encaminha query e token da sessão ao backend', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalCount: 0,
    })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getQuery', () => ({ page: 2, pageSize: 20, status: 'Active' }))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/users.get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/users', {
      baseURL: 'https://backend.test',
      method: 'GET',
      body: undefined,
      query: { page: 2, pageSize: 20, status: 'Active' },
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha o detalhe pelo id da rota', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'abc' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParams', () => ({ id: '01980000-0000-7000-8000-000000000001' }))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/users/[id].get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith(
      '/api/v1/users/01980000-0000-7000-8000-000000000001',
      {
        baseURL: 'https://backend.test',
        method: 'GET',
        body: undefined,
        query: undefined,
        headers: { Authorization: 'Bearer session-token' },
      },
    )
  })
})

describe('RN-062 catálogo de Perfis - BFF Nitro', () => {
  it('encaminha o filtro de escopo ao backend', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({
      items: [], page: 1, pageSize: 20, totalCount: 0,
    })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getQuery', () => ({ scope: 'Brokerage' }))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/profiles.get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/profiles', {
      baseURL: 'https://backend.test',
      method: 'GET',
      body: undefined,
      query: { scope: 'Brokerage' },
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha o detalhe do perfil pelo id da rota', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'abc', permissions: [] })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParams', () => ({ id: '01980000-0000-7000-8000-000000000031' }))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/profiles/[id].get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith(
      '/api/v1/profiles/01980000-0000-7000-8000-000000000031',
      {
        baseURL: 'https://backend.test',
        method: 'GET',
        body: undefined,
        query: undefined,
        headers: { Authorization: 'Bearer session-token' },
      },
    )
  })
})
