import type { components } from '~/types/gen/api'

type GetEnablementResponse = components['schemas']['GetBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<GetEnablementResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<GetEnablementResponse>(`/api/v1/brokerage-insurer-enablements/${id}`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
