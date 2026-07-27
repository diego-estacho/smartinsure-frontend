import type { components } from '~/types/gen/api'

export type SearchPersonsResponse = components['schemas']['SearchPersonsResponse']
export type PersonSearchItem = components['schemas']['PersonSearchItemResponse']
export type PersonAddress = components['schemas']['PersonAddressResponse']

/**
 * Pessoas (`Person`) — busca por termo e papel. O Segurado é o papel `Insured` de uma Pessoa
 * (glossário), então a etapa 2 usa `searchPersons({ term, role: 'Insured' })`. Cada item da busca
 * já traz `mainAddress` e `roles` — não há endpoint de detalhe. Acesso só via BFF (ADR-008).
 */
export function usePersons(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function searchPersons(params: {
    term: string
    role?: string
  }): Promise<SearchPersonsResponse> {
    return await api<SearchPersonsResponse>('/api/persons', {
      method: 'GET',
      query: {
        term: params.term,
        ...(params.role ? { role: params.role } : {}),
      },
    })
  }

  return { searchPersons }
}
