import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ChangeEnablementStatusBody = components['schemas']['ChangeBrokerageInsurerEnablementStatusBody']
type ChangeEnablementStatusResponse = components['schemas']['ChangeBrokerageInsurerEnablementStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeEnablementStatusResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeEnablementStatusBody>(event)

  return await proxyBackend<ChangeEnablementStatusResponse>(event, `/api/v1/brokerage-insurer-enablements/${id}/status`, {
    method: 'PATCH',
    body,
  })
})
