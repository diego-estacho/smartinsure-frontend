import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type EditUserBody = components['schemas']['EditUserBody']
type EditUserResponse = components['schemas']['EditUserResponse']

// RN-202: edição de Usuário — nome sempre; e-mail só enquanto Pendente (o servidor valida a situação,
// atualiza a identidade e reenvia o Convite). O front só coleta a forma.
export default defineEventHandler(async (event): Promise<EditUserResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<EditUserBody>(event)

  return await proxyBackend<EditUserResponse>(
    event,
    `/api/v1/users/${id}`,
    { method: 'PUT', body },
  )
})
