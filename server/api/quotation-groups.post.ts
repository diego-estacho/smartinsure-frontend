/**
 * BFF (ADR-008): cria o Grupo de Cotação em Rascunho (POST /api/v1/quotation-groups, RN-050).
 * O browser nunca fala direto com o backend; a sessão vai no cabeçalho a partir do cookie httpOnly.
 */
export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')
  const body = await readBody(event)

  return await $fetch('/api/v1/quotation-groups', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
