import type { components } from '~/types/gen/api'

type UpdateEnablementBody = components['schemas']['UpdateBrokerageInsurerEnablementBody']
type UpdateEnablementResponse = components['schemas']['UpdateBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<UpdateEnablementResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateEnablementBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<UpdateEnablementResponse>(`/api/v1/brokerage-insurer-enablements/${id}`, {
    baseURL: backendBaseUrl,
    method: 'PUT',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
