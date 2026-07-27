import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type RestoreImportedAdditionalCoverageResponse = components['schemas']['RestoreImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<RestoreImportedAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<RestoreImportedAdditionalCoverageResponse>(event, `/api/v1/imported-additional-coverages/${id}/restore`, {
    method: 'POST',
  })
})
