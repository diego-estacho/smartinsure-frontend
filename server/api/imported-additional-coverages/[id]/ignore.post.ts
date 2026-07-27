import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type IgnoreImportedAdditionalCoverageResponse = components['schemas']['IgnoreImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<IgnoreImportedAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<IgnoreImportedAdditionalCoverageResponse>(event, `/api/v1/imported-additional-coverages/${id}/ignore`, {
    method: 'POST',
  })
})
