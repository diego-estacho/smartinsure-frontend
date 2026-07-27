import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetBrokerageResponse = components['schemas']['GetBrokerageResponse']

export default defineEventHandler(async (event): Promise<GetBrokerageResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<GetBrokerageResponse>(event, `/api/v1/brokerages/${id}`, {
    method: 'GET',
  })
})
