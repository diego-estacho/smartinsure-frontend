import type { components } from '~/types/gen/api'

type GetBrokerageHistoryResponse = components['schemas']['GetBrokerageHistoryResponse']

// RN-055: linha do tempo da Corretora derivada da auditoria.
export default defineEventHandler(async (event): Promise<GetBrokerageHistoryResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<GetBrokerageHistoryResponse>(`/api/v1/brokerages/${id}/history`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
