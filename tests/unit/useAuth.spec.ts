import { describe, expect, it, vi } from 'vitest'
import { useAuth } from '../../app/composables/useAuth'

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

describe('RN-005 autenticação de Usuário — composable useAuth', () => {
  it('envia o login via BFF, nunca direto ao backend', async () => {
    fetchMock.mockResolvedValueOnce({ expiresAtUtc: '2026-07-16T20:00:00Z' })

    const { login } = useAuth()
    await login({ email: 'maria@corretora.com.br', password: 'senha-secreta' })

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      body: { email: 'maria@corretora.com.br', password: 'senha-secreta' },
    })
  })

  it('propaga a recusa do servidor sem decidir regra no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('401'))

    const { login } = useAuth()

    await expect(
      login({ email: 'maria@corretora.com.br', password: 'senha-errada' }),
    ).rejects.toThrow()
  })

  it('encerra a sessão via BFF no logout', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true })

    const { logout } = useAuth()
    await logout()

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
  })
})
