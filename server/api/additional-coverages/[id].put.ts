import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type AdditionalCoverageNameBody = components['schemas']['AdditionalCoverageNameBody']
type UpdateAdditionalCoverageResponse = components['schemas']['UpdateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<UpdateAdditionalCoverageResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<AdditionalCoverageNameBody>(event)

  return await proxyBackend<UpdateAdditionalCoverageResponse>(event, `/api/v1/additional-coverages/${id}`, {
    method: 'PUT',
    body,
  })
})
