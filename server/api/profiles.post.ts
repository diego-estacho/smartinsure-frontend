import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ScopedProfileBody = components['schemas']['ScopedProfileBody']
type CreateScopedProfileResponse = components['schemas']['CreateScopedProfileResponse']

/** RN-069/RN-070: perfil customizado no escopo ativo do solicitante (lido do acesso). */
export default defineEventHandler(async (event): Promise<CreateScopedProfileResponse> => {
  const body = await readBody<ScopedProfileBody>(event)

  return await proxyBackend<CreateScopedProfileResponse>(event, '/api/v1/profiles', {
    method: 'POST',
    body,
  })
})
