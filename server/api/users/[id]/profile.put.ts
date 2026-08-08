import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type SetUserProfileBody = components['schemas']['SetUserProfileBody']
type SetUserProfileResponse = components['schemas']['SetUserProfileResponse']

// RN-012: concede/revoga o Perfil no Escopo Sistema (Administrador do Sistema). O servidor decide o efeito.
export default defineEventHandler(async (event): Promise<SetUserProfileResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<SetUserProfileBody>(event)

  return await proxyBackend<SetUserProfileResponse>(
    event,
    `/api/v1/users/${id}/profile`,
    { method: 'PUT', body },
  )
})
