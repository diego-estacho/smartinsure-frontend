import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type SearchPersonsResponse = components['schemas']['SearchPersonsResponse']

/**
 * BFF (ADR-008): busca de Pessoas por termo e papel. O browser nunca fala direto com o backend;
 * a sessão vai no cabeçalho a partir do cookie httpOnly. Usado na etapa 2 (Segurado = papel
 * `Insured` de uma Pessoa).
 */
export default defineEventHandler(async (event): Promise<SearchPersonsResponse> => {
  const query = getQuery(event)

  return await proxyBackend<SearchPersonsResponse>(event, '/api/v1/persons', {
    method: 'GET',
    query,
  })
})
