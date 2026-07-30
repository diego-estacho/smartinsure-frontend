import { describe, expect, it, vi } from 'vitest'
import { useInvitations } from '../../app/composables/useInvitations'

const fetchMock = vi.fn()
const api = fetchMock as unknown as typeof $fetch

describe('RN-065 primeiro acesso por Convite — composable useInvitations', () => {
  it('envia token e senha via BFF, nunca direto ao backend', async () => {
    fetchMock.mockResolvedValueOnce({
      userId: '01980000-0000-7000-8000-000000000005',
      name: 'Carla Souza',
      email: 'carla@corretora.com.br',
      status: 'Active',
    })

    const { acceptInvitation } = useInvitations(api)
    const accepted = await acceptInvitation({ token: 'tok-123', password: 'senha-forte-1' })

    expect(fetchMock).toHaveBeenCalledWith('/api/users/invitations/accept', {
      method: 'POST',
      body: { token: 'tok-123', password: 'senha-forte-1' },
    })
    // A transição Pendente → Ativo é decisão do servidor; o front só reflete.
    expect(accepted.status).toBe('Active')
    expect(accepted.email).toBe('carla@corretora.com.br')
  })

  it('propaga a recusa do servidor (token usado/expirado) sem decidir no cliente', async () => {
    fetchMock.mockRejectedValueOnce(new Error('410'))

    const { acceptInvitation } = useInvitations(api)

    await expect(
      acceptInvitation({ token: 'tok-usado', password: 'senha-forte-1' }),
    ).rejects.toThrow()
  })
})
