import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ChangeUserScopeProfileBody = components['schemas']['ChangeUserScopeProfileBody']
type ChangeUserScopeProfileResponse = components['schemas']['ChangeUserScopeProfileResponse']

// RN-075: troca do Perfil no vínculo (Corretora/Tomador). O servidor valida se o Perfil cabe no Escopo.
export default defineEventHandler(async (event): Promise<ChangeUserScopeProfileResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<ChangeUserScopeProfileBody>(event)

  return await proxyBackend<ChangeUserScopeProfileResponse>(
    event,
    `/api/v1/users/${id}/scope-profile`,
    { method: 'PUT', body },
  )
})
