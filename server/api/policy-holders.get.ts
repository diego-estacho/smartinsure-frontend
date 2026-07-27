import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type PolicyHolderListResponse = components['schemas']['PagedResponseOfPolicyHolderListItemResponse']

export default defineEventHandler(async (event): Promise<PolicyHolderListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<PolicyHolderListResponse>(event, '/api/v1/policy-holders', {
    method: 'GET',
    query,
  })
})
