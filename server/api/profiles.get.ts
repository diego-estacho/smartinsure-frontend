import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ProfileListResponse = components['schemas']['PagedResponseOfProfileListItemResponse']

export default defineEventHandler(async (event): Promise<ProfileListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<ProfileListResponse>(event, '/api/v1/profiles', {
    method: 'GET',
    query,
  })
})
