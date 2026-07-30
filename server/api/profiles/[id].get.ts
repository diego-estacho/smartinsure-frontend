import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetProfileResponse = components['schemas']['GetProfileResponse']

export default defineEventHandler(async (event): Promise<GetProfileResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<GetProfileResponse>(event, `/api/v1/profiles/${id}`, {
    method: 'GET',
  })
})
