import type { components } from '~/types/gen/api'

type AdditionalCoverageNameBody = components['schemas']['AdditionalCoverageNameBody']
type CreateAdditionalCoverageResponse = components['schemas']['CreateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<CreateAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const body = await readBody<AdditionalCoverageNameBody>(event)
  const token = getCookie(event, 'sessao')

  return await $fetch<CreateAdditionalCoverageResponse>('/api/v1/additional-coverages', {
    baseURL: backendBaseUrl,
    method: 'POST',
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
