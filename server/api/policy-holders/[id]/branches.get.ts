import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ListPolicyHolderBranchesResponse = components['schemas']['ListPolicyHolderBranchesResponse']

export default defineEventHandler(async (event): Promise<ListPolicyHolderBranchesResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<ListPolicyHolderBranchesResponse>(event, `/api/v1/policy-holders/${id}/branches`, {
    method: 'GET',
  })
})
