import type { components } from '~/types/gen/api'

type SearchPersonsResponse = components['schemas']['SearchPersonsResponse']

/**
 * BFF (ADR-008): busca de Pessoas por termo e papel. O browser nunca fala direto com o backend;
 * a sessão vai no cabeçalho a partir do cookie httpOnly. Usado na etapa 2 (Segurado = papel
 * `Insured` de uma Pessoa).
 */
export default defineEventHandler(async (event): Promise<SearchPersonsResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<SearchPersonsResponse>('/api/v1/persons', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
