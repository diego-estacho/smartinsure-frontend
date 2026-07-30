import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type InvitePolicyHolderAdministratorBody = components['schemas']['InvitePolicyHolderAdministratorBody']
type InvitePolicyHolderAdministratorResponse = components['schemas']['InvitePolicyHolderAdministratorResponse']

/**
 * RN-068: o Corretor Administrador cria um Tomador Administrador. A corretora ativa não vai no
 * corpo — o backend a lê do acesso (ADR-065), então o cliente não age em nome de outra corretora.
 */
export default defineEventHandler(async (event): Promise<InvitePolicyHolderAdministratorResponse> => {
  const body = await readBody<InvitePolicyHolderAdministratorBody>(event)

  return await proxyBackend<InvitePolicyHolderAdministratorResponse>(
    event,
    '/api/v1/users/policy-holder-administrators',
    { method: 'POST', body },
  )
})
