import type { components } from '~/types/gen/api'

export type InsurerListResponse = components['schemas']['PagedResponseOfInsurerListItemResponse']
export type InsurerListItemResponse = components['schemas']['InsurerListItemResponse']

export function useInsurers(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listInsurers(
    params: { page?: number, pageSize?: number, status?: string, includeInactive?: boolean } = {},
  ): Promise<InsurerListResponse> {
    return await api<InsurerListResponse>('/api/insurers', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 100,
        ...(params.status ? { status: params.status } : {}),
        ...(params.includeInactive ? { includeInactive: true } : {}),
      },
    })
  }

  return { listInsurers }
}
