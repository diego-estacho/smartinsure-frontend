import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type RequestPasswordResetResponse = components['schemas']['RequestPasswordResetResponse']

// RN-203: dispara a redefinição de senha de um Usuário Ativo — o servidor gera o link e envia por
// e-mail. O front só dispara e reflete o resultado.
export default defineEventHandler(async (event): Promise<RequestPasswordResetResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<RequestPasswordResetResponse>(
    event,
    `/api/v1/users/${id}/password-reset`,
    { method: 'POST' },
  )
})
