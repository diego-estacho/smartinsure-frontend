import type { components } from '~/types/gen/api'

type UpdateBrokerageBody = components['schemas']['UpdateBrokerageBody']
type GetBrokerageResponse = components['schemas']['GetBrokerageResponse']

// RN-054: edição de dados complementares da Corretora.
export default defineEventHandler(async (event): Promise<GetBrokerageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateBrokerageBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<GetBrokerageResponse>(`/api/v1/brokerages/${id}`, {
    baseURL: backendBaseUrl,
    method: 'PATCH',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
