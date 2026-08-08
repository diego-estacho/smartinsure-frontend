import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type UserListResponse = components['schemas']['ListUsersResponse']

export default defineEventHandler(async (event): Promise<UserListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<UserListResponse>(event, '/api/v1/users', {
    method: 'GET',
    query,
  })
})
