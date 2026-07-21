import type { components } from '~/types/gen/api'

type AddPolicyHolderAddressBody = components['schemas']['AddPolicyHolderAddressBody']
type PolicyHolderAddressResponse = components['schemas']['PolicyHolderAddressResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAddressResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id } = getRouterParams(event)
  const body = await readBody<AddPolicyHolderAddressBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<PolicyHolderAddressResponse>(
    `/api/v1/policy-holders/${id}/addresses`,
    {
      baseURL: backendBaseUrl,
      method: 'POST',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
})
