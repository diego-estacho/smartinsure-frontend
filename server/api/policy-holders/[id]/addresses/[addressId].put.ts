import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type UpdatePolicyHolderAddressBody = components['schemas']['UpdatePolicyHolderAddressBody']
type PolicyHolderAddressResponse = components['schemas']['PolicyHolderAddressResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAddressResponse> => {
  const { id, addressId } = getRouterParams(event)
  const body = await readBody<UpdatePolicyHolderAddressBody>(event)

  return await proxyBackend<PolicyHolderAddressResponse>(event, `/api/v1/policy-holders/${id}/addresses/${addressId}`, {
    method: 'PUT',
    body,
  })
})
