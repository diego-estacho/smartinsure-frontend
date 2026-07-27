import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ChangeModalityStatusBody = components['schemas']['ChangeModalityStatusBody']
type ChangeModalityStatusResponse = components['schemas']['ChangeModalityStatusResponse']

export default defineEventHandler(async (event): Promise<ChangeModalityStatusResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<ChangeModalityStatusBody>(event)

  return await proxyBackend<ChangeModalityStatusResponse>(event, `/api/v1/modalities/${id}/status`, {
    method: 'PATCH',
    body,
  })
})
