import type { components } from '~/types/gen/api'

type GetBrokerageResponse = components['schemas']['GetBrokerageResponse']

export default defineEventHandler(async (event): Promise<GetBrokerageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<GetBrokerageResponse>(`/api/v1/brokerages/${id}`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
