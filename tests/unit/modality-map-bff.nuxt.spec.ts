// @vitest-environment nuxt
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('RN-036 Mapa de Modalidades - BFF Nitro', () => {
  it('encaminha token ao backend ao carregar o mapa, sem o browser falar direto (ADR-008)', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ modalities: [], pending: [] })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/modality-map.get')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/modality-map', {
      baseURL: 'https://backend.test',
      method: 'GET',
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})

describe('RN-037 Fila de Revisão - BFF Nitro', () => {
  it('encaminha corpo, token e rota ao reatribuir a Modalidade Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedModalityId: 'i-1', modalityId: 'm-1', linkSource: 'Manual' })
    const body = { modalityId: 'm-1' }
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('readBody', vi.fn().mockResolvedValue(body))
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-modalities/[id]/reassign.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-modalities/i-1/reassign', {
      baseURL: 'https://backend.test',
      method: 'POST',
      body,
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao ignorar a Modalidade Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedModalityId: 'i-1', ignored: true })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-modalities/[id]/ignore.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-modalities/i-1/ignore', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })

  it('encaminha token e rota ao reativar a Modalidade Importada', async () => {
    const backendFetchMock = vi.fn().mockResolvedValue({ importedModalityId: 'i-1', ignored: false })
    const runtimeConfig = useRuntimeConfig() as { backendBaseUrl: string }
    runtimeConfig.backendBaseUrl = 'https://backend.test'

    vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
    vi.stubGlobal('getCookie', () => 'session-token')
    vi.stubGlobal('getRouterParam', () => 'i-1')
    vi.stubGlobal('$fetch', backendFetchMock)

    const { default: handler } = await import('../../server/api/imported-modalities/[id]/restore.post')
    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(backendFetchMock).toHaveBeenCalledWith('/api/v1/imported-modalities/i-1/restore', {
      baseURL: 'https://backend.test',
      method: 'POST',
      headers: { Authorization: 'Bearer session-token' },
    })
  })
})
