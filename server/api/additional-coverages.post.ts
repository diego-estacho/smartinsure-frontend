import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type AdditionalCoverageNameBody = components['schemas']['AdditionalCoverageNameBody']
type CreateAdditionalCoverageResponse = components['schemas']['CreateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<CreateAdditionalCoverageResponse> => {
  const body = await readBody<AdditionalCoverageNameBody>(event)

  return await proxyBackend<CreateAdditionalCoverageResponse>(event, '/api/v1/additional-coverages', {
    method: 'POST',
    body,
  })
})
