import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CurrentUserContext = components['schemas']['GetCurrentUserContextResponse']

/** RN-064: contexto do próprio acesso — vínculos e escopo ativo (ADR-008). */
export default defineEventHandler(async (event): Promise<CurrentUserContext> => {
  return await proxyBackend<CurrentUserContext>(event, '/api/v1/me', {
    method: 'GET',
  })
})
