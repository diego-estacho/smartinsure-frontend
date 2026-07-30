import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ScopedProfileBody = components['schemas']['ScopedProfileBody']
type UpdateScopedProfileResponse = components['schemas']['UpdateScopedProfileResponse']

/** RN-074: edição de perfil customizado do próprio escopo. */
export default defineEventHandler(async (event): Promise<UpdateScopedProfileResponse> => {
  const { id } = getRouterParams(event)
  const body = await readBody<ScopedProfileBody>(event)

  return await proxyBackend<UpdateScopedProfileResponse>(event, `/api/v1/profiles/${id}`, {
    method: 'PUT',
    body,
  })
})
