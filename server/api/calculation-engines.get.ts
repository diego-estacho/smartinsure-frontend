import { proxyBackend } from "~~/server/utils/proxyBackend"
import type { components } from '~/types/gen/api'

type CalculationEngineListItemResponse = components['schemas']['CalculationEngineListItemResponse']

export default defineEventHandler(async (event): Promise<CalculationEngineListItemResponse[]> => {
  return await proxyBackend<CalculationEngineListItemResponse[]>(event, '/api/v1/calculation-engines', {
    method: 'GET',
  })
})
