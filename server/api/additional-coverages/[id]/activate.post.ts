import type { components } from '~/types/gen/api'

type ActivateAdditionalCoverageResponse = components['schemas']['ActivateAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<ActivateAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<ActivateAdditionalCoverageResponse>(`/api/v1/additional-coverages/${id}/activate`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
