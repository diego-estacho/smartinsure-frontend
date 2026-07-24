// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-040 Cobertura Adicional - BFF Nitro', () => {
  it('encaminha corpo e token ao criar no backend, sem o browser falar direto (ADR-008)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'c-1', name: 'Multa', status: 'Active' })
    const body = { name: 'Multa' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/additional-coverages.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/additional-coverages', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha corpo, token e rota ao editar o nome via PUT', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'c-1', name: 'Multa Rescisória', status: 'Active' })
    const body = { name: 'Multa Rescisória' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'c-1')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/additional-coverages/[id].put')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/additional-coverages/c-1', {
      baseURL: 'https://backend.test',
      method: 'PUT',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao ativar a canônica', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'c-1', status: 'Active' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'c-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/additional-coverages/[id]/activate.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/additional-coverages/c-1/activate', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao inativar a canônica (RN-044: nunca exclui)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'c-1', status: 'Inactive' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'c-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/additional-coverages/[id]/inactivate.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/additional-coverages/c-1/inactivate', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
