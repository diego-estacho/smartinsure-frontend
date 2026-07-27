/**
 * $api — $fetch com interceptor de sessão (ADR-007/008): 401 do BFF significa sessão
 * inválida ou expirada em voo; encerra a sessão local e leva ao login. Composables de
 * dado usam $api; o fluxo de login usa $fetch cru (401 lá é credencial, não sessão).
 */
type Fetcher = (url: string, options: { method: 'POST' }) => Promise<unknown>
type Navigate = (to: string) => Promise<unknown> | unknown

export function createSessionExpiredHandler(fetcher: Fetcher, navigate: Navigate) {
  return async ({ response }: { response: { status: number } }) => {
    if (response.status === 401) {
      await fetcher('/api/auth/logout', { method: 'POST' }).catch(() => {})
      await navigate('/login')
    }
  }
}

export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    // SSR: encaminha o cookie de sessão da requisição de entrada para o BFF. Sem isso, a busca
    // de dados server-side vai sem sessão, cai em 401 e o cliente refaz o fetch — gerando erro de
    // SSR e hydration mismatch. No cliente o browser já anexa o cookie automaticamente.
    onRequest({ options }) {
      if (import.meta.server) {
        const cookie = useRequestHeaders(['cookie']).cookie
        if (cookie) {
          const headers = new Headers(options.headers)
          headers.set('cookie', cookie)
          options.headers = headers
        }
      }
    },
    onResponseError: createSessionExpiredHandler($fetch, navigateTo),
  })

  return { provide: { api } }
})
