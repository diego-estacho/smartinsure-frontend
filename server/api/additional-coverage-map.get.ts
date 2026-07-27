import { proxyBackend } from '~~/server/utils/proxyBackend'
import type { components } from '~/types/gen/api'

type AdditionalCoverageMapResponse = components['schemas']['AdditionalCoverageMapResponse']

export default defineEventHandler(async (event): Promise<AdditionalCoverageMapResponse> => {
  return await proxyBackend<AdditionalCoverageMapResponse>(event, '/api/v1/additional-coverages/map', {
    method: 'GET',
  })
})
