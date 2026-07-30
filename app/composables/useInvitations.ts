import type { components } from '~/types/gen/api'

export type AcceptInvitationRequest = components['schemas']['AcceptInvitationRequest']
export type AcceptInvitationResponse = components['schemas']['AcceptInvitationResponse']

/**
 * Primeiro acesso por Convite (RN-065). Usa `$fetch` cru, não o `$api`: quem está concluindo o
 * convite ainda não tem sessão, e o interceptor de 401 do `$api` levaria ao login em vez de
 * mostrar a recusa real (token usado/expirado). A validade do token é decisão do servidor.
 */
export function useInvitations(api: typeof $fetch = $fetch) {
  async function acceptInvitation(
    request: AcceptInvitationRequest,
  ): Promise<AcceptInvitationResponse> {
    return await api<AcceptInvitationResponse>('/api/users/invitations/accept', {
      method: 'POST',
      body: request,
    })
  }

  return { acceptInvitation }
}
