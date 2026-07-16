/**
 * Encerra a sessão (RN-006): revoga o acesso no backend (denylist até a expiração) e
 * remove o cookie httpOnly (ADR-007). A revogação é melhor-esforço — backend fora do ar
 * não impede o encerramento local; o token expira sozinho em até 8 horas (RN-005).
 */
export default defineEventHandler(async (event): Promise<{ ok: true }> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')

  if (token) {
    await $fetch('/api/v1/auth/logout', {
      baseURL: backendBaseUrl,
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }

  deleteCookie(event, 'sessao', { path: '/' })

  return { ok: true }
})
