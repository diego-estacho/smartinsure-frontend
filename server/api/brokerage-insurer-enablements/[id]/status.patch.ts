import type { components } from '~/types/gen/api'

type ChangeEnablementStatusBody = components['schemas']['ChangeBrokerageInsurerEnablementStatusBody']
type ChangeEnablementStatusResponse = components['schemas']['ChangeBrokerageInsurerEnablementStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeEnablementStatusResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeEnablementStatusBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<ChangeEnablementStatusResponse>(`/api/v1/brokerage-insurer-enablements/${id}/status`, {
    baseURL: backendBaseUrl,
    method: 'PATCH',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
