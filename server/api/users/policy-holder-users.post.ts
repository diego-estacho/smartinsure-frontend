import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InvitePolicyHolderUserBody = components['schemas']['InvitePolicyHolderUserBody']
type InvitePolicyHolderUserResponse = components['schemas']['InvitePolicyHolderUserResponse']

/** RN-070: o Tomador Administrador cria usuário do tomador ativo (lido do acesso). */
export default defineEventHandler(async (event): Promise<InvitePolicyHolderUserResponse> => {
  const body = await readBody<InvitePolicyHolderUserBody>(event)

  return await proxyBackend<InvitePolicyHolderUserResponse>(
    event,
    '/api/v1/users/policy-holder-users',
    { method: 'POST', body },
  )
})
