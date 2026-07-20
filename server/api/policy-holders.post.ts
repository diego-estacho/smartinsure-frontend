import type { components } from '~/types/gen/api'

type CreatePolicyHolderRequest = components['schemas']['CreatePolicyHolderRequest']
type CreatePolicyHolderResponse = components['schemas']['CreatePolicyHolderResponse']

export default defineEventHandler(async (event): Promise<CreatePolicyHolderResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<CreatePolicyHolderRequest>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreatePolicyHolderResponse>('/api/v1/policy-holders', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
