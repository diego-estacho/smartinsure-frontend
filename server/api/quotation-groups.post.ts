/**
 * BFF (ADR-008): cria o Grupo de Cotação em Rascunho (POST /api/v1/quotation-groups, RN-050).
 * O browser nunca fala direto com o backend; a sessão vai no cabeçalho a partir do cookie httpOnly.
 * Erros do backend (ex.: validação 400 com ProblemDetails) são repassados com status + corpo, para
 * a tela mostrar a mensagem real em vez de um erro genérico.
 */
export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')
  const body = await readBody(event)

  try {
    return await $fetch('/api/v1/quotation-groups', {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  }
  catch (error) {
    const httpError = error as { status?: number, data?: unknown }
    setResponseStatus(event, httpError.status ?? 502)
    return httpError.data ?? { title: 'Não foi possível comunicar com o servidor.' }
  }
})
