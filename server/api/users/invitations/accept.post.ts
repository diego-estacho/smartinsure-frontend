import type { components } from '~/types/gen/api'

type AcceptInvitationRequest = components['schemas']['AcceptInvitationRequest']
type AcceptInvitationResponse = components['schemas']['AcceptInvitationResponse']

/** Corpo ProblemDetails (RFC 9457) devolvido pelo backend em falha. */
interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
}

/**
 * BFF do primeiro acesso por Convite (RN-065, ADR-008). Rota anônima por natureza: quem chega
 * aqui ainda não tem sessão — a autorização é o próprio token de uso único, validado no servidor.
 * Nenhum cookie é definido aqui: concluída a definição de senha, o Usuário entra pelo login.
 * A recusa (token usado, expirado ou Usuário já Ativo) repassa o ProblemDetails do servidor.
 */
export default defineEventHandler(async (event): Promise<AcceptInvitationResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<AcceptInvitationRequest>(event)

  try {
    return await $fetch<AcceptInvitationResponse>('/api/v1/users/invitations/accept', {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
    })
  }
  catch (error) {
    const fetchError = error as { statusCode?: number, data?: ProblemDetails }
    throw createError({
      statusCode: fetchError.statusCode ?? 502,
      statusMessage: fetchError.data?.title ?? 'Não foi possível concluir o primeiro acesso.',
      data: fetchError.data,
    })
  }
})
