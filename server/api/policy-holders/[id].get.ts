import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetPolicyHolderResponse = components['schemas']['GetPolicyHolderResponse']

export default defineEventHandler(async (event): Promise<GetPolicyHolderResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<GetPolicyHolderResponse>(event, `/api/v1/policy-holders/${id}`, {
    method: 'GET',
  })
})
