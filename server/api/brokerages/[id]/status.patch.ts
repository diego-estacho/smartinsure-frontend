import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ChangeBrokerageStatusBody = components['schemas']['ChangeBrokerageStatusBody']
type ChangeBrokerageStatusResponse = components['schemas']['ChangeBrokerageStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeBrokerageStatusResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeBrokerageStatusBody>(event)

  return await proxyBackend<ChangeBrokerageStatusResponse>(event, `/api/v1/brokerages/${id}/status`, {
    method: 'PATCH',
    body,
  })
})
