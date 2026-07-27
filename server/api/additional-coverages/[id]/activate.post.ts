import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ActivateAdditionalCoverageResponse = components['schemas']['ActivateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<ActivateAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<ActivateAdditionalCoverageResponse>(event, `/api/v1/additional-coverages/${id}/activate`, {
    method: 'POST',
  })
})
