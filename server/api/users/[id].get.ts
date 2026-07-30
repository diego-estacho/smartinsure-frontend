import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetUserResponse = components['schemas']['GetUserResponse']

export default defineEventHandler(async (event): Promise<GetUserResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<GetUserResponse>(event, `/api/v1/users/${id}`, {
    method: 'GET',
  })
})
