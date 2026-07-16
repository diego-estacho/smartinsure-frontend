import { describe, expect, it, vi } from 'vitest'
import { createSessionExpiredHandler } from '../../app/plugins/api'

describe('RN-005 sessão inválida em voo — interceptor do $api', () => {
  it('401 encerra a sessão local e redireciona pro login', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    const navigate = vi.fn()

    await createSessionExpiredHandler(fetcher, navigate)({ response: { status: 401 } })

    expect(fetcher).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('erro que não é 401 não redireciona', async () => {
    const fetcher = vi.fn()
    const navigate = vi.fn()

    await createSessionExpiredHandler(fetcher, navigate)({ response: { status: 500 } })

    expect(fetcher).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('falha no logout não impede o redirecionamento', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('rede'))
    const navigate = vi.fn()

    await createSessionExpiredHandler(fetcher, navigate)({ response: { status: 401 } })

    expect(navigate).toHaveBeenCalledWith('/login')
  })
})
