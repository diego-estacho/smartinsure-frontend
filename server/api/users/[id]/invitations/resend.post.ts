import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ResendInvitationResponse = components['schemas']['ResendInvitationResponse']

// RN-065: reenvio do Convite enquanto o Usuário é Pendente — invalida o link anterior. O servidor
// decide a validade e o efeito; o front só dispara para o mesmo e-mail (caso "não recebi o convite").
export default defineEventHandler(async (event): Promise<ResendInvitationResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<ResendInvitationResponse>(
    event,
    `/api/v1/users/${id}/invitations/resend`,
    { method: 'POST' },
  )
})
