import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type RestoreImportedModalityResponse = components['schemas']['RestoreImportedModalityResponse']

export default defineEventHandler(async (event): Promise<RestoreImportedModalityResponse> => {
  const id = getRouterParam(event, 'id')

  return await proxyBackend<RestoreImportedModalityResponse>(event, `/api/v1/imported-modalities/${id}/restore`, {
    method: 'POST',
  })
})
