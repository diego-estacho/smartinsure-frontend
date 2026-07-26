import type { components } from '~/types/gen/api'

type AdditionalCoverageMapResponse = components['schemas']['AdditionalCoverageMapResponse']

export default defineEventHandler(async (event): Promise<AdditionalCoverageMapResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<AdditionalCoverageMapResponse>('/api/v1/additional-coverages/map', {
    baseURL: backendBaseUrl,
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
