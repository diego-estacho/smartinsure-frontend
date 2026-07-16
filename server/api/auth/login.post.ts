import type { components } from '~/types/gen/api'

type AuthenticateUserRequest = components['schemas']['AuthenticateUserRequest']
type AuthenticateUserResponse = components['schemas']['AuthenticateUserResponse']

/** Corpo ProblemDetails (RFC 9457) devolvido pelo backend em falha. */
interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
}

/**
 * BFF do login (RN-005, ADR-008): valida as credenciais no backend e guarda o token
 * da sessão em cookie httpOnly (ADR-007) — o token nunca chega ao browser. A recusa
 * repassa o ProblemDetails do servidor sem decidir regra aqui.
 */
export default defineEventHandler(async (event): Promise<{ expiresAtUtc: string }> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<AuthenticateUserRequest>(event)

  let response: AuthenticateUserResponse

  try {
    response = await $fetch<AuthenticateUserResponse>('/api/v1/auth/login', {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
    })
  }
  catch (error) {
    const fetchError = error as { statusCode?: number, data?: ProblemDetails }
    throw createError({
      statusCode: fetchError.statusCode ?? 502,
      statusMessage: fetchError.data?.title ?? 'Falha de autenticação.',
      data: fetchError.data,
    })
  }

  const expiresAtUtc = response.expiresAtUtc ?? ''
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiresAtUtc).getTime() - Date.now()) / 1000),
  )

  setCookie(event, 'sessao', response.accessToken ?? '', {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge,
  })

  return { expiresAtUtc }
})
