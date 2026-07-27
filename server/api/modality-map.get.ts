import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type ModalityMapResponse = components['schemas']['ModalityMapResponse']

export default defineEventHandler(async (event): Promise<ModalityMapResponse> => {
  return await proxyBackend<ModalityMapResponse>(event, '/api/v1/modality-map', {
    method: 'GET',
  })
})
