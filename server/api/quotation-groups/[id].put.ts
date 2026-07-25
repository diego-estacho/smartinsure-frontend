/**
 * BFF (ADR-008): atualiza o Grupo de Cotação em Rascunho (PUT /api/v1/quotation-groups/{id}, RN-051).
 * O id vem da rota; o corpo é o contrato do grupo. A sessão vai no cabeçalho a partir do cookie httpOnly.
 * Erros do backend (ex.: validação 400) são repassados com status + corpo, para a tela mostrar a mensagem real.
 */
export default defineEventHandler(async (event) => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  try {
    return await $fetch(`/api/v1/quotation-groups/${id}`, {
      baseURL: backendBaseUrl,
      method: 'PUT',
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
