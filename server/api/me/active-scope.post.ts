import type { components } from '~/types/gen/api'

type SwitchActiveScopeBody = components['schemas']['SwitchActiveScopeBody']
type SwitchActiveScopeResponse = components['schemas']['SwitchActiveScopeResponse']

/** Corpo ProblemDetails (RFC 9457) devolvido pelo backend em falha. */
interface ProblemDetails {
  title?: string
  detail?: string
}

/**
 * BFF da troca de Escopo ativo (RN-064, ADR-065). O backend reemite o acesso com a nova
 * Corretora/Tomador ativo; aqui o cookie httpOnly da sessão é substituído pelo novo token —
 * o browser nunca vê o token (ADR-007). Sem escopo válido, o backend recusa e nada é trocado.
 */
export default defineEventHandler(async (event): Promise<{ activeBrokerageId: string | null, activePolicyHolderId: string | null }> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')
  const body = await readBody<SwitchActiveScopeBody>(event)

  let response: SwitchActiveScopeResponse

  try {
    response = await $fetch<SwitchActiveScopeResponse>('/api/v1/me/active-scope', {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }
  catch (error) {
    const fetchError = error as { statusCode?: number, status?: number, data?: ProblemDetails }
    throw createError({
      statusCode: fetchError.statusCode ?? fetchError.status ?? 502,
      statusMessage: fetchError.data?.title ?? 'Não foi possível trocar o escopo.',
      data: fetchError.data,
    })
  }

  const expiresAt = new Date(response.expiresAtUtc ?? '').getTime()

  if (!response.accessToken || Number.isNaN(expiresAt)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Resposta inválida do serviço de troca de escopo.',
    })
  }

  setCookie(event, 'sessao', response.accessToken, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
  })

  return {
    activeBrokerageId: response.activeBrokerageId ?? null,
    activePolicyHolderId: response.activePolicyHolderId ?? null,
  }
})
