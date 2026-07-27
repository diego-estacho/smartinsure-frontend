import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InsurerListResponse = components['schemas']['PagedResponseOfInsurerListItemResponse']

export default defineEventHandler(async (event): Promise<InsurerListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<InsurerListResponse>(event, '/api/v1/insurers', {
    method: 'GET',
    query,
  })
})
