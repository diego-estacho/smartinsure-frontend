import type { components } from '~/types/gen/api'

type InactivateAdditionalCoverageResponse = components['schemas']['InactivateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<InactivateAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<InactivateAdditionalCoverageResponse>(`/api/v1/additional-coverages/${id}/inactivate`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
