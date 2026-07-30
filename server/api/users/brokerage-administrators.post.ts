import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InviteBrokerageAdministratorRequest = components['schemas']['InviteBrokerageAdministratorRequest']
type InviteBrokerageAdministratorResponse = components['schemas']['InviteBrokerageAdministratorResponse']

export default defineEventHandler(async (event): Promise<InviteBrokerageAdministratorResponse> => {
  const body = await readBody<InviteBrokerageAdministratorRequest>(event)

  return await proxyBackend<InviteBrokerageAdministratorResponse>(
    event,
    '/api/v1/users/brokerage-administrators',
    {
      method: 'POST',
      body,
    },
  )
})
