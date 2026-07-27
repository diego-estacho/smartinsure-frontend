import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type UnlinkImportedAdditionalCoverageResponse = components['schemas']['UnlinkImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<UnlinkImportedAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<UnlinkImportedAdditionalCoverageResponse>(event, `/api/v1/imported-additional-coverages/${id}/unlink`, {
    method: 'POST',
  })
})
