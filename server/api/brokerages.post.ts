import type { components } from '~/types/gen/api'

type CreateBrokerageRequest = components['schemas']['CreateBrokerageRequest']
type CreateBrokerageResponse = components['schemas']['CreateBrokerageResponse']

export default defineEventHandler(async (event): Promise<CreateBrokerageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreateBrokerageRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateBrokerageResponse>('/api/v1/brokerages', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
