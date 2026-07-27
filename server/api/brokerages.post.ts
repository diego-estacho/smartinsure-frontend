import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreateBrokerageRequest = components['schemas']['CreateBrokerageRequest']
type CreateBrokerageResponse = components['schemas']['CreateBrokerageResponse']

export default defineEventHandler(async (event): Promise<CreateBrokerageResponse> => {
  const body = await readBody<CreateBrokerageRequest>(event)

  return await proxyBackend<CreateBrokerageResponse>(event, '/api/v1/brokerages', {
    method: 'POST',
    body,
  })
})
