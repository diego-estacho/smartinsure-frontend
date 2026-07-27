import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type AddPolicyHolderAddressBody = components['schemas']['AddPolicyHolderAddressBody']
type PolicyHolderAddressResponse = components['schemas']['PolicyHolderAddressResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderAddressResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<AddPolicyHolderAddressBody>(event)

  return await proxyBackend<PolicyHolderAddressResponse>(event, `/api/v1/policy-holders/${id}/addresses`, {
    method: 'POST',
    body,
  })
})
