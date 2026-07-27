import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type LinkImportedAdditionalCoverageBody = components['schemas']['LinkImportedAdditionalCoverageBody']
type LinkImportedAdditionalCoverageResponse = components['schemas']['LinkImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<LinkImportedAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<LinkImportedAdditionalCoverageBody>(event)

  return await proxyBackend<LinkImportedAdditionalCoverageResponse>(event, `/api/v1/imported-additional-coverages/${id}/link`, {
    method: 'POST',
    body,
  })
})
