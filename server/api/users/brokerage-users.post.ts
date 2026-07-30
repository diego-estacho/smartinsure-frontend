import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InviteBrokerageUserBody = components['schemas']['InviteBrokerageUserBody']
type InviteBrokerageUserResponse = components['schemas']['InviteBrokerageUserResponse']

/** RN-069: o Corretor Administrador cria Usuário na corretora ativa (lida do acesso). */
export default defineEventHandler(async (event): Promise<InviteBrokerageUserResponse> => {
  const body = await readBody<InviteBrokerageUserBody>(event)

  return await proxyBackend<InviteBrokerageUserResponse>(
    event,
    '/api/v1/users/brokerage-users',
    { method: 'POST', body },
  )
})
