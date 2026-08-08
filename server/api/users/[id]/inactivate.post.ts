import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ChangeUserActivationResponse = components['schemas']['ChangeUserActivationResponse']

// RN-076: inativação do Usuário — decisão e transição de situação são do servidor.
export default defineEventHandler(async (event): Promise<ChangeUserActivationResponse> => {
  const { id } = getRouterParams(event)

  return await proxyBackend<ChangeUserActivationResponse>(
    event,
    `/api/v1/users/${id}/inactivate`,
    { method: 'POST' },
  )
})
