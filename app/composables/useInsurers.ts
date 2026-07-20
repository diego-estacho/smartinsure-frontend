import type { components } from '~/types/gen/api'

export type InsurerListResponse = components['schemas']['PagedResponseOfInsurerListItemResponse']
export type InsurerListItemResponse = components['schemas']['InsurerListItemResponse']

export function useInsurers(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listInsurers(
    params: { page?: number, pageSize?: number, includeInactive?: boolean } = {},
  ): Promise<InsurerListResponse> {
    return await api<InsurerListResponse>('/api/insurers', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 100,
        ...(params.includeInactive ? { includeInactive: true } : {}),
      },
    })
  }

  return { listInsurers }
}
