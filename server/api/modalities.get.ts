import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ModalityListResponse = components['schemas']['PagedResponseOfModalityListItemResponse']

export default defineEventHandler(async (event): Promise<ModalityListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<ModalityListResponse>(event, '/api/v1/modalities', {
    method: 'GET',
    query,
  })
})
