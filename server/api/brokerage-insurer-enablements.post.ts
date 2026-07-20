import type { components } from '~/types/gen/api'

type CreateEnablementRequest = components['schemas']['CreateBrokerageInsurerEnablementRequest']
type CreateEnablementResponse = components['schemas']['CreateBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<CreateEnablementResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreateEnablementRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateEnablementResponse>('/api/v1/brokerage-insurer-enablements', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
