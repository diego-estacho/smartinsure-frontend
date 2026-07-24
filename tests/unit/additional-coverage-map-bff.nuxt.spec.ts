// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-043/RN-046 Mapa de Coberturas Adicionais - BFF Nitro', () => {
  it('encaminha token ao backend ao carregar o mapa, sem o browser falar direto (ADR-008)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ coverages: [], pending: [] })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/additional-coverage-map.get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/additional-coverages/map', {
      baseURL: 'https://backend.test',
      method: 'GET',
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha corpo, token e rota ao vincular a Cobertura Adicional Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedCoverageId: 'i-1', additionalCoverageId: 'c-1' })
    const body = { additionalCoverageId: 'c-1' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-additional-coverages/[id]/link.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-additional-coverages/i-1/link', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao desvincular a Cobertura Adicional Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedCoverageId: 'i-1' })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-additional-coverages/[id]/unlink.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-additional-coverages/i-1/unlink', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao ignorar a Cobertura Adicional Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedCoverageId: 'i-1', ignored: true })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-additional-coverages/[id]/ignore.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-additional-coverages/i-1/ignore', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao reativar a Cobertura Adicional Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedCoverageId: 'i-1', ignored: false })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-additional-coverages/[id]/restore.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-additional-coverages/i-1/restore', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
