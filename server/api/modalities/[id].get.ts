import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetModalityResponse = components['schemas']['GetModalityResponse']

export default defineEventHandler(async (event): Promise<GetModalityResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<GetModalityResponse>(event, `/api/v1/modalities/${id}`, {
    method: 'GET',
  })
})
