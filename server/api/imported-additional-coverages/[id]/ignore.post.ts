import type { components } from '~/types/gen/api'

type IgnoreImportedAdditionalCoverageResponse = components['schemas']['IgnoreImportedAdditionalCoverageResponse']

export default defineEventHandler(async (event): Promise<IgnoreImportedAdditionalCoverageResponse> => {
  const { backendBaseUrl } = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const token = getCookie(event, 'sessao')

  return await $fetch<IgnoreImportedAdditionalCoverageResponse>(`/api/v1/imported-additional-coverages/${id}/ignore`, {
    baseURL: backendBaseUrl,
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
})
