import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type EnablementListResponse = components['schemas']['PagedResponseOfBrokerageInsurerEnablementListItemResponse']

export default defineEventHandler(async (event): Promise<EnablementListResponse> => {
  const query = getQuery(event)

  return await proxyBackend<EnablementListResponse>(event, '/api/v1/brokerage-insurer-enablements', {
    method: 'GET',
    query,
  })
})
