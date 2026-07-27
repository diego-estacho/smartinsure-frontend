import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreatePolicyHolderRequest = components['schemas']['CreatePolicyHolderRequest']
type CreatePolicyHolderResponse = components['schemas']['CreatePolicyHolderResponse']

export default defineEventHandler(async (event): Promise<CreatePolicyHolderResponse> => {
  const body = await readBody<CreatePolicyHolderRequest>(event)

  return await proxyBackend<CreatePolicyHolderResponse>(event, '/api/v1/policy-holders', {
    method: 'POST',
    body,
  })
})
