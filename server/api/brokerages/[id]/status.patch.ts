import type { components } from '~/types/gen/api'

type ChangeBrokerageStatusBody = components['schemas']['ChangeBrokerageStatusBody']
type ChangeBrokerageStatusResponse = components['schemas']['ChangeBrokerageStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeBrokerageStatusResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeBrokerageStatusBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ChangeBrokerageStatusResponse>(`/api/v1/brokerages/${id}/status`, {
    baseURL: backendBaseUrl,
    method: 'PATCH',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
