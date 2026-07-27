import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ReassignImportedModalityBody = components['schemas']['ReassignImportedModalityBody']
type ReassignImportedModalityResponse = components['schemas']['ReassignImportedModalityResponse']

export default defineEventHandler(async (event): Promise<ReassignImportedModalityResponse> => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<ReassignImportedModalityBody>(event)

  return await proxyBackend<ReassignImportedModalityResponse>(event, `/api/v1/imported-modalities/${id}/reassign`, {
    method: 'POST',
    body,
  })
})
