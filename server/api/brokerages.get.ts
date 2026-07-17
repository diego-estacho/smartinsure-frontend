import type { components } from '~/types/gen/api'

type BrokerageListResponse = components['schemas']['PagedResponseOfBrokerageListItemResponse']

export default defineEventHandler(async (event): Promise<BrokerageListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<BrokerageListResponse>('/api/v1/brokerages', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
