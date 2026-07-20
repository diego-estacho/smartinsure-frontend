import type { components } from '~/types/gen/api'

type EnablementListResponse = components['schemas']['PagedResponseOfBrokerageInsurerEnablementListItemResponse']

export default defineEventHandler(async (event): Promise<EnablementListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<EnablementListResponse>('/api/v1/brokerage-insurer-enablements', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
