import type { components } from '~/types/gen/api'
import type { BrokerageStatus } from '~/lib/status/brokerages'

export type BrokerageListResponse = components['schemas']['PagedResponseOfBrokerageListItemResponse']
export type BrokerageListItem = components['schemas']['BrokerageListItemResponse']
export type CreateBrokerageRequest = components['schemas']['CreateBrokerageRequest']
export type CreateBrokerageResponse = components['schemas']['CreateBrokerageResponse']
export type GetBrokerageResponse = components['schemas']['GetBrokerageResponse']
export type ChangeBrokerageStatusResponse = components['schemas']['ChangeBrokerageStatusResponse']

export function useBrokerages(api: typeof $fetch = useNuxtApp().$api as typeof $fetch) {
  async function listBrokerages(params: {
    page?: number
    pageSize?: number
    status?: BrokerageStatus | null
  } = {}): Promise<BrokerageListResponse> {
    return await api<BrokerageListResponse>('/api/brokerages', {
      method: 'GET',
      query: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        ...(params.status ? { status: params.status } : {}),
      },
    })
  }

  async function createBrokerage(request: CreateBrokerageRequest): Promise<CreateBrokerageResponse> {
    return await api<CreateBrokerageResponse>('/api/brokerages', {
      method: 'POST',
      body: request,
    })
  }

  async function getBrokerage(id: string): Promise<GetBrokerageResponse> {
    return await api<GetBrokerageResponse>(`/api/brokerages/${id}`, {
      method: 'GET',
    })
  }

  async function changeBrokerageStatus(
    id: string,
    status: BrokerageStatus,
  ): Promise<ChangeBrokerageStatusResponse> {
    return await api<ChangeBrokerageStatusResponse>(`/api/brokerages/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })
  }

  return {
    listBrokerages,
    createBrokerage,
    getBrokerage,
    changeBrokerageStatus,
  }
}
