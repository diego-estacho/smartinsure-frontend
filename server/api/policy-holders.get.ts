import type { components } from '~/types/gen/api'

type PolicyHolderListResponse = components['schemas']['PagedResponseOfPolicyHolderListItemResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderListResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const query = getQuery(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<PolicyHolderListResponse>('/api/v1/policy-holders', {
    baseURL: backendBaseUrl,
    method: 'GET',
    query,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
