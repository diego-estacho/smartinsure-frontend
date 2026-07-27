import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type UpdateModalityBody = components['schemas']['UpdateModalityBody']
type UpdateModalityResponse = components['schemas']['UpdateModalityResponse']

export default defineEventHandler(async (event): Promise<UpdateModalityResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<UpdateModalityBody>(event)

  return await proxyBackend<UpdateModalityResponse>(event, `/api/v1/modalities/${id}`, {
    method: 'PUT',
    body,
  })
})
