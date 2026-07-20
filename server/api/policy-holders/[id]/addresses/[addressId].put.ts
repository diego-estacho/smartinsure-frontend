import type { components } from '~/types/gen/api'

type UpdatePolicyHolderAddressBody = components['schemas']['UpdatePolicyHolderAddressBody']
type PolicyHolderAddressResponse = components['schemas']['PolicyHolderAddressResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAddressResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const { id, addressId } = getRouterParams(event)
  const body = await readBody<UpdatePolicyHolderAddressBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<PolicyHolderAddressResponse>(
    `/api/v1/policy-holders/${id}/addresses/${addressId}`,
    {
      baseURL: backendBaseUrl,
      method: 'PUT',
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
})
