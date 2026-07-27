import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreateEnablementRequest = components['schemas']['CreateBrokerageInsurerEnablementRequest']
type CreateEnablementResponse = components['schemas']['CreateBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<CreateEnablementResponse> => {
  const body = await readBody<CreateEnablementRequest>(event)

  return await proxyBackend<CreateEnablementResponse>(event, '/api/v1/brokerage-insurer-enablements', {
    method: 'POST',
    body,
  })
})
