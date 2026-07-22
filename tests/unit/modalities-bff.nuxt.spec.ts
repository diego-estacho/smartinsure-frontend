// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-029 Grupo de Modalidade - BFF Nitro', () => {
  it('encaminha corpo e token ao criar no backend, sem o browser falar direto (ADR-008)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'g-1', status: 'Active' })
    const body = { name: 'Fiança', description: null, displayOrder: 1, initialStatus: 'Active' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/modality-groups.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/modality-groups', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})

describe('RN-036 Modalidade - BFF Nitro', () => {
  it('encaminha corpo, token e rota de status ao backend', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ id: 'm-1', status: 'Inactive' })
    const body = { status: 'Inactive' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'm-1')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/modalities/[id]/status.patch')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/modalities/m-1/status', {
      baseURL: 'https://backend.test',
      method: 'PATCH',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
