import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type IgnoreImportedModalityResponse = components['schemas']['IgnoreImportedModalityResponse']

export default defineEventHandler(async (event): Promise<IgnoreImportedModalityResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<IgnoreImportedModalityResponse>(event, `/api/v1/imported-modalities/${id}/ignore`, {
    method: 'POST',
  })
})
