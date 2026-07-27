import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type BrokerageListResponse = components['schemas']['PagedResponseOfBrokerageListItemResponse']

export default defineEventHandler(async (event): Promise<BrokerageListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<BrokerageListResponse>(event, '/api/v1/brokerages', {
    method: 'GET',
    query,
  })
})
