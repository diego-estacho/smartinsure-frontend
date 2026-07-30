import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type FixedProfilePermissionsBody = components['schemas']['FixedProfilePermissionsBody']
type UpdateFixedProfilePermissionsResponse = components['schemas']['UpdateFixedProfilePermissionsResponse']

/**
 * RN-073: só o Administrador do Sistema marca/desmarca permissões de perfil fixo, com efeito
 * global. A autorização é do backend (policy) — aqui é só encaminhamento.
 */
export default defineEventHandler(async (event): Promise<UpdateFixedProfilePermissionsResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<FixedProfilePermissionsBody>(event)

  return await proxyBackend<UpdateFixedProfilePermissionsResponse>(
    event,
    `/api/v1/profiles/${id}/permissions`,
    { method: 'PUT', body },
  )
})
