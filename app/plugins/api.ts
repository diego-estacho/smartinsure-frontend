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
    onResponseError: createSessionExpiredHandler($fetch, navigateTo),
  })

  return { provide: { api } }
})
