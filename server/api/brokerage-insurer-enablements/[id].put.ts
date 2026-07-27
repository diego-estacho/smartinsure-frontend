import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type UpdateEnablementBody = components['schemas']['UpdateBrokerageInsurerEnablementBody']
type UpdateEnablementResponse = components['schemas']['UpdateBrokerageInsurerEnablementResponse']

export default defineEventHandler(async (event): Promise<UpdateEnablementResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateEnablementBody>(event)

  return await proxyBackend<UpdateEnablementResponse>(event, `/api/v1/brokerage-insurer-enablements/${id}`, {
    method: 'PUT',
    body,
  })
})
