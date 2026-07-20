import type { components } from '~/types/gen/api'

type CalculationEngineListItemResponse = components['schemas']['CalculationEngineListItemResponse']

export default defineEventHandler(async (event): Promise<CalculationEngineListItemResponse[]> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CalculationEngineListItemResponse[]>('/api/v1/calculation-engines', {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
