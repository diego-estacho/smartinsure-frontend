import type { components } from '~/types/gen/api'

type GetPolicyHolderResponse = components['schemas']['GetPolicyHolderResponse']

export default defineEventHandler(async (event): Promise<GetPolicyHolderResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id } = getRouterParams(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<GetPolicyHolderResponse>(`/api/v1/policy-holders/${id}`, {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
