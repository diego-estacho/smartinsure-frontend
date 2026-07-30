import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type AssignableProfile = components['schemas']['AssignableProfileResponse']

/** RN-072: perfis que o próprio solicitante pode atribuir no escopo ativo. */
export default defineEventHandler(async (event): Promise<AssignableProfile[]> => {
  return await proxyBackend<AssignableProfile[]>(event, '/api/v1/profiles/assignable', {
    method: 'GET',
  })
})
