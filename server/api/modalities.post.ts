import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CreateModalityRequest = components['schemas']['CreateModalityRequest']
type CreateModalityResponse = components['schemas']['CreateModalityResponse']

export default defineEventHandler(async (event): Promise<CreateModalityResponse> => {
  const body = await readBody<CreateModalityRequest>(event)

  return await proxyBackend<CreateModalityResponse>(event, '/api/v1/modalities', {
    method: 'POST',
    body,
  })
})
