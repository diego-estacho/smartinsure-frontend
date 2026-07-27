import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type GetEnablementResponse = components['schemas']['GetBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<GetEnablementResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<GetEnablementResponse>(event, `/api/v1/brokerage-insurer-enablements/${id}`, {
    method: 'GET',
  })
})
