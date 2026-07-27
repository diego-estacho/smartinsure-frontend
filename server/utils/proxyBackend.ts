import type { H3Event } from 'h3'

/**
 * BFF (ADR-008): proxy central do BFF Nitro para o backend .NET.
 *
 * Centraliza o que os handlers de `server/api/**` repetiam: lê o `backendBaseUrl` do
 * runtimeConfig, injeta o token da sessão (cookie httpOnly `sessao`, ADR-007) no
 * cabeçalho Authorization, e encaminha método + corpo + query opcionais.
 *
 * Propaga erros fielmente (generaliza o try/catch de quotation-groups.post / [id].put):
 * um 400/409 do backend é reemitido com o status original + o corpo ProblemDetails
 * (RFC 9457), para a tela mostrar a mensagem real em vez de um 500 opaco. Falhas sem
 * status HTTP (rede/DNS/backend fora do ar) viram 502 Bad Gateway.
 */
export async function proxyBackend<T = unknown>(
  event: H3Event,
  path: string,
  options: {
    method?: string
    body?: unknown
    query?: Record<string, unknown>
  } = {},
): Promise<T> {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')

  try {
    // $fetch<T> devolve TypedInternalResponse<…, T>, que o TS não reduz ao T genérico aqui;
    // o cast alinha o retorno ao contrato do helper (o corpo já é o payload do backend).
    const data = await $fetch<T>(path, {
      baseURL: backendBaseUrl,
      method: (options.method ?? 'GET') as never,
      body: options.body as never,
      query: options.query,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return data as T
  }
  catch (error) {
    const httpError = error as { status?: number, data?: unknown }
    // Falha sem status HTTP (rede/DNS/backend fora do ar) → 502 Bad Gateway.
    setResponseStatus(event, httpError.status ?? 502)
    return (httpError.data ?? { title: 'Não foi possível comunicar com o servidor.' }) as T
  }
}
