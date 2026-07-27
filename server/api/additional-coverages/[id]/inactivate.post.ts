import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InactivateAdditionalCoverageResponse = components['schemas']['InactivateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<InactivateAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<InactivateAdditionalCoverageResponse>(event, `/api/v1/additional-coverages/${id}/inactivate`, {
    method: 'POST',
  })
})
