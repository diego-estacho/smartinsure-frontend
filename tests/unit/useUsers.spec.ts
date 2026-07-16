import { describe, expect, it, vi } from 'vitest'
import { useUsers } from '../../app/composables/useUsers'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

describe('RN-001 criação de Usuário — composable useUsers', () => {
  it('envia a criação via BFF, nunca direto ao backend', async () => {
    fetchMock.mockResolvedValueOnce({
      id: '0197...',
      name: 'Maria Silva',
      email: 'maria@corretora.com.br',
      status: 'Pending',
    })

    const { createUser } = useUsers(api)
    const user = await createUser({ name: 'Maria Silva', email: 'maria@corretora.com.br' })

    expect(fetchMock).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      body: { name: 'Maria Silva', email: 'maria@corretora.com.br' },
    })
    expect(user.status).toBe('Pending')
  })

  it('propaga o erro do servidor sem decidir regra no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('409'))

    const { createUser } = useUsers(api)

    await expect(
      createUser({ name: 'Maria Silva', email: 'maria@corretora.com.br' }),
    ).rejects.toThrow()
  })
})
